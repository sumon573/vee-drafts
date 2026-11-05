/**
 * useVoiceRoom — LiveKit voice for one room (vertical slice).
 *
 * Connects to the staging LiveKit (via the staging API token endpoint)
 * and tracks remote participants + who is speaking. Modelled on Vee's
 * useLivekitVoiceRoom core flow, simplified for the slice (no
 * minimisation, no background audio).
 *
 * Mic model (YoHo): entering a room connects you as a LISTENER.
 * The microphone is published only while you hold a mic seat
 * (publishMic = true). Leaving the seat unpublishes it. Mute toggles
 * the published mic; it only applies while seated.
 *
 * Flow:
 * 1. fetchLivekitToken(roomId, userName) from the staging API
 *    (POST {API_BASE}/api/livekit/token, Firebase ID token auth).
 * 2. room.connect(url, token) — LiveKit JS client.
 * 3. setMicrophoneEnabled(publishMic && !muted) — publish only on a seat.
 * 4. Track participants + ActiveSpeakersChanged for the speaking halo.
 * 5. Disconnect on unmount / leave.
 *
 * Audio: registerGlobals() from @livekit/react-native-webrtc is called
 * once (required for WebRTC in React Native). The audio session is
 * configured for voice chat (speaker output) via @livekit/react-native's
 * AudioSession.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, type Participant } from 'livekit-client';
import { registerGlobals } from '@livekit/react-native-webrtc';
import { AudioSession } from '@livekit/react-native';
import { fetchLivekitToken } from '../config/api';

registerGlobals();

export type VoiceParticipant = {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
};

export type VoiceRoomState = {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  participants: VoiceParticipant[];
  isMuted: boolean;
  toggleMute: () => Promise<void>;
  disconnect: () => Promise<void>;
};

function participantToVoice(
  identity: string,
  name: string | undefined,
  isMicrophoneEnabled: boolean | undefined,
  speaking: Set<string>,
  isLocal: boolean,
): VoiceParticipant {
  return {
    identity,
    name: name && name !== '' ? name : identity,
    isLocal,
    isSpeaking: speaking.has(identity),
    isMuted: isMicrophoneEnabled === false,
  };
}

export function useVoiceRoom(
  roomId: string | null,
  userName: string,
  enabled: boolean,
  publishMic: boolean,
): VoiceRoomState {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const speakingRef = useRef<Set<string>>(new Set());
  const publishMicRef = useRef(publishMic);
  const isMutedRef = useRef(isMuted);
  // Keep the refs in sync so toggleMute (a stable callback) always reads
  // the latest values. Synced in an effect, not during render.
  useEffect(() => {
    publishMicRef.current = publishMic;
    isMutedRef.current = isMuted;
  }, [publishMic, isMuted]);

  const rebuildParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) {
      setParticipants([]);
      return;
    }
    const speaking = speakingRef.current;
    const list: VoiceParticipant[] = [];
    const local = room.localParticipant;
    list.push(
      participantToVoice(
        local.identity,
        local.name,
        local.isMicrophoneEnabled,
        speaking,
        true,
      ),
    );
    room.remoteParticipants.forEach((p) => {
      list.push(
        participantToVoice(
          p.identity,
          p.name,
          p.isMicrophoneEnabled,
          speaking,
          false,
        ),
      );
    });
    setParticipants(list);
  }, []);

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.disconnect();
    } catch {
      // Already disconnected
    }
    roomRef.current = null;
    setConnected(false);
    setParticipants([]);
    speakingRef.current = new Set();
  }, []);

  // Connect / disconnect the room.
  useEffect(() => {
    if (!enabled || !roomId || !userName) return;
    let cancelled = false;
    const room = new Room();
    roomRef.current = room;

    const onSpeakersChanged = (speakers: Participant[]) => {
      speakingRef.current = new Set(speakers.map((s) => s.identity));
      rebuildParticipants();
    };
    const onParticipantConnected = () => rebuildParticipants();
    const onParticipantDisconnected = () => rebuildParticipants();
    const onTrackMuted = () => rebuildParticipants();
    const onTrackUnmuted = () => rebuildParticipants();
    const onDisconnected = () => {
      if (!cancelled) {
        setConnected(false);
        setParticipants([]);
      }
    };

    room.on(RoomEvent.ActiveSpeakersChanged, onSpeakersChanged);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackMuted, onTrackMuted);
    room.on(RoomEvent.TrackUnmuted, onTrackUnmuted);
    room.on(RoomEvent.Disconnected, onDisconnected);

    (async () => {
      // Reset the connection state at the start of the attempt.
      // Inside the async callback (not the effect body), so it does not
      // trigger a cascading render from the effect itself.
      setConnecting(true);
      setError(null);
      try {
        await AudioSession.startAudioSession();
        const { token, url } = await fetchLivekitToken(roomId, userName);
        if (cancelled) return;
        await room.connect(url, token);
        if (cancelled) return;
        // Listen-only until the user holds a seat.
        await room.localParticipant.setMicrophoneEnabled(false);
        if (cancelled) return;
        setConnected(true);
        rebuildParticipants();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Voice connection failed.');
        }
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.ActiveSpeakersChanged, onSpeakersChanged);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackMuted, onTrackMuted);
      room.off(RoomEvent.TrackUnmuted, onTrackUnmuted);
      room.off(RoomEvent.Disconnected, onDisconnected);
      void disconnect();
      void AudioSession.stopAudioSession().catch(() => undefined);
    };
  }, [enabled, roomId, userName, rebuildParticipants, disconnect]);

  // Publish / unpublish the mic when the seat state changes.
  useEffect(() => {
    const room = roomRef.current;
    if (!room || !connected) return;
    const want = publishMic && !isMuted;
    void room.localParticipant
      .setMicrophoneEnabled(want)
      .then(() => rebuildParticipants())
      .catch(() => undefined);
  }, [publishMic, isMuted, connected, rebuildParticipants]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !publishMicRef.current) return;
    const next = !isMutedRef.current;
    setIsMuted(next);
    await room.localParticipant.setMicrophoneEnabled(!next);
    rebuildParticipants();
  }, [rebuildParticipants]);

  return {
    connected,
    connecting,
    error,
    participants,
    isMuted,
    toggleMute,
    disconnect,
  };
}
