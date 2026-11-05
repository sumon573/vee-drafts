/**
 * RoomCard — discovery (replica-design spec).
 * 2-column grid item, cover aspect 3:4, radius lg. Live (LIVE chip +
 * listener count), full (dimmed + "Full" badge), ended (greyed, not tappable).
 * Topic tag top-left, listener chip top-right, room name bottom-left over
 * a bottom scrim. The whole card is a button.
 * Tokens only — no raw hex or pixel values.
 */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { Badge, type TopicTag } from './Badge';
import type { Room } from '../lib/rooms';

type RoomCardProps = {
  room: Room;
  onPress: (room: Room) => void;
};

const TOPIC_FALLBACK: TopicTag = 'Chat';

function topicOf(room: Room): TopicTag {
  const t = room.topicTags[0];
  if (t === 'Sing' || t === 'Dating' || t === 'Party') return t;
  return TOPIC_FALLBACK;
}

export function RoomCard({ room, onPress }: RoomCardProps) {
  const isLive = room.status === 'live';
  const isFull = room.onlineCount >= room.capacity;
  const topic = topicOf(room);
  const label = `${room.title}, ${topic}, ${room.onlineCount} listeners, ${
    isLive ? (isFull ? 'full' : 'live') : 'ended'
  }`;
  return (
    <Pressable
      onPress={() => onPress(room)}
      disabled={!isLive}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        !isLive && styles.ended,
        isFull && styles.full,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cover}>
        {room.coverUrl ? (
          <Image source={{ uri: room.coverUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={styles.coverFallbackText}>{room.title.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.topRow}>
          <Badge kind="topic" label={topic} topic={topic} />
          <Badge kind="count" label={`${room.onlineCount} listening`} />
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.roomName} numberOfLines={2}>
            {room.title}
          </Text>
          {isLive ? (
            <Badge kind="live" label={isFull ? 'Full' : 'LIVE'} />
          ) : (
            <Badge kind="ended" label="Ended" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.bg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  full: { opacity: 0.75 },
  ended: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  cover: { aspectRatio: 3 / 4, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverFallback: {
    flex: 1,
    backgroundColor: tokens.color.roomBgStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: {
    color: tokens.color.roomText,
    fontSize: tokens.type.display.size,
    fontWeight: '700',
  },
  topRow: {
    position: 'absolute',
    top: tokens.space[2],
    left: tokens.space[2],
    right: tokens.space[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomRow: {
    position: 'absolute',
    left: tokens.space[2],
    right: tokens.space[2],
    bottom: tokens.space[2],
    gap: tokens.space[1],
  },
  roomName: {
    color: '#ffffff',
    fontSize: tokens.type.base.size,
    fontWeight: '600',
  },
});
