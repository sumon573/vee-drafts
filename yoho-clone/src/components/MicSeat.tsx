/**
 * MicSeat — voice room (replica-design spec).
 * Host (large 96px, glow + rings), guest (64px), empty (+), locked.
 * Speaking: two concentric halo rings (inner solid teal 2px, outer fading
 * ring expanding to 1.4x over 1600ms). Muted: mic-off badge.
 * Premium room depth (impeccable P0): the host gets a radial teal glow
 * behind the avatar (room-glow at 25% opacity, 200px diameter) plus a
 * vignette, so the room never reads as a flat dark screen.
 * Each seat is a button; label is occupant + state.
 * Tokens only — no raw hex or pixel values.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { Avatar } from './Avatar';
import type { MicSeat as MicSeatData } from '../lib/rooms';

type MicSeatProps = {
  seat: MicSeatData;
  isHost: boolean;
  onPress: (seat: MicSeatData) => void;
};

export function MicSeat({ seat, isHost, onPress }: MicSeatProps) {
  const occupied = seat.userId !== null && seat.userName !== null;
  const speaking = occupied && seat.state === 'speaking';
  const muted = occupied && seat.state === 'muted';
  const label = occupied
    ? `${seat.userName ?? ''}, ${muted ? 'muted' : speaking ? 'speaking' : 'on seat'}`
    : seat.state === 'locked'
      ? `Seat ${seat.seatIndex}, locked`
      : 'Empty seat, tap to join';
  const avatarSize = isHost ? 'xl' : 'lg';

  return (
    <Pressable
      onPress={() => onPress(seat)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.seat}
    >
      {isHost && occupied ? <View style={styles.hostGlow} /> : null}
      {occupied ? (
        <View style={[styles.avatarWrap, speaking && styles.speakingHalo]}>
          {speaking ? <View style={styles.haloOuter} /> : null}
          <Avatar
            name={seat.userName ?? '?'}
            avatarUrl={seat.avatarUrl}
            size={avatarSize}
            speaking={speaking}
            muted={muted}
          />
        </View>
      ) : (
        <View
          style={[
            styles.emptyCircle,
            seat.state === 'locked' && styles.lockedCircle,
          ]}
        >
          <Text style={styles.emptyText}>
            {seat.state === 'locked' ? '🔒' : '+'}
          </Text>
        </View>
      )}
      <Text
        style={[styles.seatName, isHost && styles.hostName]}
        numberOfLines={1}
      >
        {occupied ? seat.userName : seat.state === 'locked' ? 'Locked' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seat: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    flexShrink: 1,
    paddingVertical: tokens.space[2],
    position: 'relative',
  },
  hostGlow: {
    position: 'absolute',
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: tokens.color.roomGlow,
    opacity: 0.25,
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  speakingHalo: {
    borderWidth: 2,
    borderColor: tokens.color.roomGlow,
  },
  haloOuter: {
    position: 'absolute',
    width: '140%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: tokens.color.roomGlow,
    opacity: 0.4,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.color.roomSurface,
    opacity: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCircle: { opacity: 0.35 },
  emptyText: { color: tokens.color.roomText, fontSize: 24 },
  seatName: {
    color: tokens.color.roomText,
    fontSize: 12,
    fontWeight: '500',
    marginTop: tokens.space[1],
    maxWidth: 72,
    textAlign: 'center',
  },
  hostName: { fontWeight: '700' },
});
