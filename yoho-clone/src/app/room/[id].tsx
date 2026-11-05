/**
 * S07 Voice room (recon S07, design spec: Mic seat, Chat message row,
 * Chat input bar, room theme). The core screen.
 *
 * Flow (recon F02): join a live room -> listen -> take a mic seat ->
 * talk -> chat -> leave. The host sits on seat 0; guests take seats
 * 1-8. Voice connects on entry (listen-only); the mic publishes only
 * while the user holds a seat. Mute toggles the published mic and the
 * RTDB seat state together.
 *
 * Room theme: dark teal-slate gradient (roomBgStart -> roomBgEnd) with
 * a radial teal glow behind the host + a vignette (impeccable P0), so
 * the room never reads as a flat dark screen.
 *
 * Gifts are the next milestone (milestone 2) — the gift button says so
 * plainly instead of pretending to work.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import {
  claimSeat,
  endRoom,
  joinRoom,
  leaveRoom,
  releaseSeat,
  sendMessage,
  setSeatMuted,
  subscribeMessages,
  subscribeRoom,
  subscribeSeats,
  type MicSeat as MicSeatData,
  type Room,
  type RoomMessage,
} from '../../lib/rooms';
import { useVoiceRoom } from '../../lib/useVoiceRoom';
import { MicSeat } from '../../components/MicSeat';
import { ChatMessageRow } from '../../components/ChatMessageRow';
import { ChatInputBar } from '../../components/ChatInputBar';
import { tokens } from '../../theme/tokens';

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomMissing, setRoomMissing] = useState(false);
  const [seats, setSeats] = useState<MicSeatData[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [seatBusy, setSeatBusy] = useState(false);
  const listRef = useRef<FlatList<RoomMessage>>(null);

  const userName = user?.nickname ?? 'Guest';
  const voice = useVoiceRoom(id ?? null, userName, !!id && !!user, mySeat !== null);

  // Subscribe to room + seats + messages; join on mount, leave on unmount.
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const unsubRoom = subscribeRoom(id, (r) => {
      if (!mounted) return;
      if (!r) setRoomMissing(true);
      else setRoom(r);
    });
    const unsubSeats = subscribeSeats(id, (s) => {
      if (!mounted) return;
      setSeats(s);
      if (user) {
        const mine = s.find((seat) => seat.userId === user.uid);
        setMySeat(mine ? mine.seatIndex : null);
      }
    });
    const unsubMessages = subscribeMessages(id, (m) => {
      if (!mounted) return;
      setMessages(m);
    });
    void joinRoom(id).catch(() => undefined);
    return () => {
      mounted = false;
      unsubRoom();
      unsubSeats();
      unsubMessages();
      void leaveRoom(id).catch(() => undefined);
      if (user) {
        const mine = seats.find((seat) => seat.userId === user.uid);
        if (mine) void releaseSeat(id, mine.seatIndex, user.uid).catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-scroll chat to the newest message.
  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const onSeatPress = useCallback(
    async (seat: MicSeatData) => {
      if (!user || !id || seatBusy) return;
      if (seat.state === 'locked') return;
      // Tapping my own seat: leave it.
      if (seat.userId === user.uid) {
        setSeatBusy(true);
        try {
          await releaseSeat(id, seat.seatIndex, user.uid);
          await setSeatMuted(id, seat.seatIndex, user.uid, false).catch(() => undefined);
        } finally {
          setSeatBusy(false);
        }
        return;
      }
      // Tapping an occupied seat: nothing to do in the slice.
      if (seat.userId !== null) return;
      // Tapping an empty seat: claim it (transaction — two tappers cannot both get it).
      setSeatBusy(true);
      try {
        const claimed = await claimSeat(id, seat.seatIndex, {
          uid: user.uid,
          nickname: user.nickname,
        });
        if (!claimed) {
          Alert.alert('Seat taken', 'Someone else just took this seat.');
        }
      } finally {
        setSeatBusy(false);
      }
    },
    [user, id, seatBusy],
  );

  const onToggleMute = useCallback(async () => {
    if (!user || !id || mySeat === null) return;
    const nextMuted = !voice.isMuted;
    await voice.toggleMute();
    await setSeatMuted(id, mySeat, user.uid, nextMuted).catch(() => undefined);
  }, [user, id, mySeat, voice]);

  const onSend = useCallback(
    (text: string) => {
      if (!user || !id) return;
      void sendMessage(id, { uid: user.uid, nickname: user.nickname }, text);
    },
    [user, id],
  );

  const onGiftPress = useCallback(() => {
    Alert.alert(
      'Gifts come next',
      'The gift catalog and wallet are the next milestone, after the voice loop is proven.',
    );
  }, []);

  const onExit = useCallback(() => {
    router.back();
  }, []);

  const onEndRoom = useCallback(() => {
    if (!user || !id || !room || room.hostId !== user.uid) return;
    Alert.alert('End this room?', 'Everyone in the room will be disconnected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End room',
        style: 'destructive',
        onPress: () => {
          void endRoom(id, user.uid).then(() => router.back());
        },
      },
    ]);
  }, [user, id, room]);

  if (roomMissing || (room && room.status === 'ended')) {
    return (
      <View style={styles.centerDark}>
        <Text style={styles.centerTitle}>This room has ended</Text>
        <Text style={styles.centerText}>The host ended the room.</Text>
        <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backLink}>Back to rooms</Text>
        </Pressable>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.centerDark}>
        <ActivityIndicator size="large" color={tokens.color.roomGlow} />
        <Text style={styles.centerText}>Joining room…</Text>
      </View>
    );
  }

  const hostSeat = seats.find((s) => s.seatIndex === 0);
  const guestSeats = seats.filter((s) => s.seatIndex >= 1);
  const isHost = room.hostId === user?.uid;

  return (
    <LinearGradient
      colors={[tokens.color.roomBgStart, tokens.color.roomBgEnd]}
      style={styles.root}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel="Leave room"
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>✕</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.headerMeta}>
            ID {room.publicId} · {room.onlineCount} online
          </Text>
        </View>
        {isHost ? (
          <Pressable
            onPress={onEndRoom}
            accessibilityRole="button"
            accessibilityLabel="End room"
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>End</Text>
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {voice.connecting ? (
        <Text style={styles.voiceStatus}>Connecting to voice…</Text>
      ) : voice.error ? (
        <Text style={styles.voiceError}>Voice: {voice.error}</Text>
      ) : null}

      {/* Seats */}
      <View style={styles.seats}>
        {hostSeat ? (
          <View style={styles.hostRow}>
            <MicSeat seat={hostSeat} isHost onPress={onSeatPress} />
          </View>
        ) : null}
        <View style={styles.guestGrid}>
          {guestSeats.map((seat) => (
            <View key={seat.seatIndex} style={styles.guestCell}>
              <MicSeat seat={seat} isHost={false} onPress={onSeatPress} />
            </View>
          ))}
        </View>
      </View>

      {/* Chat */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <ChatMessageRow message={item} isOwn={item.senderId === user?.uid} />
        )}
        contentContainerStyle={styles.chatList}
        style={styles.chat}
        ListEmptyComponent={
          <Text style={styles.chatEmpty}>Say hello in the room.</Text>
        }
      />

      {/* Input bar */}
      <ChatInputBar
        onSend={onSend}
        onToggleMute={onToggleMute}
        isMuted={voice.isMuted}
        filtersAvailable={false}
        onGiftPress={onGiftPress}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerDark: {
    flex: 1,
    backgroundColor: tokens.color.roomBgEnd,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    padding: tokens.space[4],
  },
  centerTitle: {
    color: tokens.color.roomText,
    fontSize: tokens.type.lg.size,
    fontWeight: '700',
  },
  centerText: { color: tokens.color.roomTextMuted, fontSize: tokens.type.base.size },
  backLink: { color: tokens.color.roomGlow, fontSize: tokens.type.base.size, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[3],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: { color: tokens.color.roomText, fontSize: 16, fontWeight: '600' },
  headerTitleWrap: { flex: 1, minWidth: 0, alignItems: 'center' },
  headerTitle: {
    color: tokens.color.roomText,
    fontSize: tokens.type.lg.size,
    fontWeight: '600',
  },
  headerMeta: { color: tokens.color.roomTextMuted, fontSize: 12 },
  voiceStatus: {
    color: tokens.color.roomTextMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: tokens.space[1],
  },
  voiceError: {
    color: tokens.color.danger,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: tokens.space[1],
  },
  seats: { paddingHorizontal: tokens.space[3] },
  hostRow: { alignItems: 'center', paddingVertical: tokens.space[2] },
  guestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guestCell: { width: '25%', alignItems: 'center' },
  chat: { flex: 1, paddingHorizontal: tokens.space[3] },
  chatList: { paddingVertical: tokens.space[2], gap: tokens.space[1] },
  chatEmpty: {
    color: tokens.color.roomTextMuted,
    fontSize: tokens.type.sm.size,
    textAlign: 'center',
    marginTop: tokens.space[4],
  },
});
