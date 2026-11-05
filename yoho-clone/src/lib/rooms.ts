/**
 * Room service — RTDB data layer for the YoHo clone vertical slice.
 *
 * All room data lives under the clone's own namespace in the staging RTDB:
 *   yoho_clone/rooms/{roomId}            room row
 *   yoho_clone/rooms/{roomId}/seats/{i}  mic seat i (0 = host, 1-8 = guests)
 *   yoho_clone/rooms/{roomId}/messages/{msgId}  room chat
 *   yoho_clone/users/{uid}               profile row (written by auth)
 *
 * This is the staging backend for the slice. The clone's own API
 * (replica-backend) will replace direct RTDB writes later; the function
 * signatures here are the data-layer contract, so swapping the
 * implementation changes no screen code (replica-build rule).
 *
 * NOTE (deployment): the staging RTDB rules are Vee's prod-shaped rules.
 * They must allow authenticated writes under yoho_clone/* for the slice
 * to create/join rooms. If the rules deny it, add a yoho_clone node to
 * the staging rules (same pattern as Vee's rules) — see build-log.md.
 *
 * Seat claims use an RTDB transaction so two users tapping the same seat
 * cannot both get it. A null current value means the seat node does not
 * exist yet (empty) — claiming it is correct. (The firebase-admin
 * provisional-null guard applies to the server SDK; the client SDK
 * delivers the real value here.)
 */
import {
  get,
  limitToLast,
  off,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  set,
  update,
  type DatabaseReference,
  type DataSnapshot,
} from 'firebase/database';
import { database } from '../config/firebase';

export type RoomEntryType = 'open' | 'password' | 'invite_only';
export type RoomStatus = 'live' | 'ended';
export type SeatState = 'empty' | 'speaking' | 'muted' | 'locked';

export type Room = {
  id: string;
  publicId: number;
  title: string;
  coverUrl: string | null;
  topicTags: string[];
  hostId: string;
  hostName: string;
  capacity: number;
  entryType: RoomEntryType;
  status: RoomStatus;
  onlineCount: number;
  createdAt: number;
};

export type MicSeat = {
  seatIndex: number;
  userId: string | null;
  userName: string | null;
  avatarUrl: string | null;
  state: SeatState;
  muted: boolean;
};

export type RoomMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'gift' | 'system';
  sentAt: number;
};

export type CreateRoomInput = {
  title: string;
  topicTags: string[];
  capacity: number;
  entryType: RoomEntryType;
};

const ROOMS_PATH = 'yoho_clone/rooms';
const MAX_CHAT_MESSAGES = 100;

/** Generate a numeric public ID (the clone's own numbering, never YoHo's). */
function nextPublicId(): number {
  return Math.floor(100000 + Math.random() * 899999);
}

function roomFromSnapshot(id: string, val: Record<string, unknown>): Room {
  return {
    id,
    publicId: typeof val.publicId === 'number' ? val.publicId : 0,
    title: typeof val.title === 'string' ? val.title : 'Room',
    coverUrl: typeof val.coverUrl === 'string' ? val.coverUrl : null,
    topicTags: Array.isArray(val.topicTags) ? (val.topicTags as string[]) : [],
    hostId: typeof val.hostId === 'string' ? val.hostId : '',
    hostName: typeof val.hostName === 'string' ? val.hostName : '',
    capacity: typeof val.capacity === 'number' ? val.capacity : 9,
    entryType: (val.entryType as RoomEntryType) || 'open',
    status: (val.status as RoomStatus) || 'live',
    onlineCount: typeof val.onlineCount === 'number' ? val.onlineCount : 0,
    createdAt: typeof val.createdAt === 'number' ? val.createdAt : 0,
  };
}

/** Subscribe to the live room list (newest first). Returns an unsubscribe function. */
export function subscribeRooms(
  onRooms: (rooms: Room[]) => void,
): () => void {
  const roomsRef = query(
    ref(database, ROOMS_PATH),
    orderByChild('createdAt'),
    limitToLast(50),
  );
  const handler = (snap: DataSnapshot) => {
    const rooms: Room[] = [];
    snap.forEach((child) => {
      const val = child.val() as Record<string, unknown> | null;
      if (val && val.status !== 'ended') {
        rooms.push(roomFromSnapshot(child.key ?? '', val));
      }
      return undefined;
    });
    rooms.reverse();
    onRooms(rooms);
  };
  onValue(roomsRef, handler);
  return () => off(roomsRef, 'value', handler);
}

/** Create a room (host takes seat 0) and return its id. */
export async function createRoom(
  input: CreateRoomInput,
  host: { uid: string; nickname: string },
): Promise<string> {
  const roomsRef = ref(database, ROOMS_PATH);
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key;
  if (!roomId) throw new Error('Could not create room');
  const now = Date.now();
  await set(newRoomRef, {
    publicId: nextPublicId(),
    title: input.title.trim() || 'Voice room',
    coverUrl: null,
    topicTags: input.topicTags,
    hostId: host.uid,
    hostName: host.nickname,
    capacity: input.capacity,
    entryType: input.entryType,
    status: 'live',
    onlineCount: 1,
    createdAt: now,
  });
  // Host seat (0)
  await set(ref(database, `${ROOMS_PATH}/${roomId}/seats/0`), {
    seatIndex: 0,
    userId: host.uid,
    userName: host.nickname,
    avatarUrl: null,
    state: 'speaking',
    muted: false,
  });
  // System message
  await push(ref(database, `${ROOMS_PATH}/${roomId}/messages`), {
    senderId: 'system',
    senderName: '',
    text: `${host.nickname} created the room`,
    type: 'system',
    sentAt: now,
  });
  return roomId;
}

/** Subscribe to one room's detail. Returns an unsubscribe function. */
export function subscribeRoom(
  roomId: string,
  onRoom: (room: Room | null) => void,
): () => void {
  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() as Record<string, unknown> | null;
    onRoom(val ? roomFromSnapshot(roomId, val) : null);
  };
  onValue(roomRef, handler);
  return () => off(roomRef, 'value', handler);
}

/** Subscribe to a room's mic seats (0-8). Returns an unsubscribe function. */
export function subscribeSeats(
  roomId: string,
  onSeats: (seats: MicSeat[]) => void,
): () => void {
  const seatsRef = ref(database, `${ROOMS_PATH}/${roomId}/seats`);
  const handler = (snap: DataSnapshot) => {
    const seats: MicSeat[] = [];
    for (let i = 0; i <= 8; i++) {
      const val = snap.child(String(i)).val() as {
        userId?: string | null;
        userName?: string | null;
        avatarUrl?: string | null;
        state?: SeatState;
        muted?: boolean;
      } | null;
      seats.push({
        seatIndex: i,
        userId: val?.userId ?? null,
        userName: val?.userName ?? null,
        avatarUrl: val?.avatarUrl ?? null,
        state: val?.state ?? 'empty',
        muted: val?.muted ?? false,
      });
    }
    onSeats(seats);
  };
  onValue(seatsRef, handler);
  return () => off(seatsRef, 'value', handler);
}

/** Subscribe to a room's chat (last N messages). Returns an unsubscribe function. */
export function subscribeMessages(
  roomId: string,
  onMessages: (messages: RoomMessage[]) => void,
): () => void {
  const messagesRef = query(
    ref(database, `${ROOMS_PATH}/${roomId}/messages`),
    orderByChild('sentAt'),
    limitToLast(MAX_CHAT_MESSAGES),
  );
  let messages: RoomMessage[] = [];
  const handler = (snap: DataSnapshot) => {
    const next: RoomMessage[] = [];
    snap.forEach((child) => {
      const val = child.val() as Record<string, unknown> | null;
      if (val) {
        next.push({
          id: child.key ?? '',
          senderId: typeof val.senderId === 'string' ? val.senderId : '',
          senderName: typeof val.senderName === 'string' ? val.senderName : '',
          text: typeof val.text === 'string' ? val.text : '',
          type: (val.type as RoomMessage['type']) || 'text',
          sentAt: typeof val.sentAt === 'number' ? val.sentAt : 0,
        });
      }
      return undefined;
    });
    messages = next;
    onMessages(messages);
  };
  onValue(messagesRef, handler);
  return () => off(messagesRef, 'value', handler);
}

/** Join a room (increments online count). */
export async function joinRoom(roomId: string): Promise<void> {
  const countRef = ref(database, `${ROOMS_PATH}/${roomId}/onlineCount`);
  await runTransaction(countRef, (current) => {
    const n = typeof current === 'number' ? current : 0;
    return n + 1;
  });
}

/** Leave a room (decrements online count). Never goes below 0. */
export async function leaveRoom(roomId: string): Promise<void> {
  const countRef = ref(database, `${ROOMS_PATH}/${roomId}/onlineCount`);
  await runTransaction(countRef, (current) => {
    const n = typeof current === 'number' ? current : 0;
    return Math.max(0, n - 1);
  });
}

/**
 * Claim a mic seat. Uses a transaction so two users tapping the same seat
 * cannot both get it. Returns true when the seat was claimed.
 */
export async function claimSeat(
  roomId: string,
  seatIndex: number,
  user: { uid: string; nickname: string },
): Promise<boolean> {
  const seatRef: DatabaseReference = ref(
    database,
    `${ROOMS_PATH}/${roomId}/seats/${seatIndex}`,
  );
  const result = await runTransaction(seatRef, (current) => {
    const cur = current as { userId?: string | null; state?: string } | null;
    // Null = seat node does not exist yet (empty) — claiming is correct.
    if (cur === null || cur.userId === null || cur.userId === undefined) {
      return {
        seatIndex,
        userId: user.uid,
        userName: user.nickname,
        avatarUrl: null,
        state: 'speaking',
        muted: false,
      };
    }
    // Already held by someone else (or this user) — do not overwrite.
    return undefined;
  });
  return result.committed;
}

/** Release a mic seat (only if this user holds it). */
export async function releaseSeat(
  roomId: string,
  seatIndex: number,
  userId: string,
): Promise<void> {
  const seatRef = ref(database, `${ROOMS_PATH}/${roomId}/seats/${seatIndex}`);
  const snap = await get(seatRef);
  const val = snap.val() as { userId?: string | null } | null;
  if (val && val.userId === userId) {
    await set(seatRef, {
      seatIndex,
      userId: null,
      userName: null,
      avatarUrl: null,
      state: 'empty',
      muted: false,
    });
  }
}

/** Set a seat's mute state (only if this user holds it). */
export async function setSeatMuted(
  roomId: string,
  seatIndex: number,
  userId: string,
  muted: boolean,
): Promise<void> {
  const seatRef = ref(database, `${ROOMS_PATH}/${roomId}/seats/${seatIndex}`);
  const snap = await get(seatRef);
  const val = snap.val() as { userId?: string | null } | null;
  if (val && val.userId === userId) {
    await update(seatRef, { muted, state: muted ? 'muted' : 'speaking' });
  }
}

/** Send a chat message to a room. */
export async function sendMessage(
  roomId: string,
  sender: { uid: string; nickname: string },
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  await push(ref(database, `${ROOMS_PATH}/${roomId}/messages`), {
    senderId: sender.uid,
    senderName: sender.nickname,
    text: trimmed,
    type: 'text',
    sentAt: Date.now(),
  });
}

/** End a room (host only). Frees the room; seats and chat stay for history. */
export async function endRoom(roomId: string, hostId: string): Promise<void> {
  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  const snap = await get(roomRef);
  const val = snap.val() as { hostId?: string } | null;
  if (val && val.hostId === hostId) {
    await update(roomRef, { status: 'ended', onlineCount: 0 });
  }
}
