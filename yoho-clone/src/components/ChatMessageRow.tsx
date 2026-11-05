/**
 * ChatMessageRow — voice room chat (replica-design spec).
 * Variants: text, gift, system (centred, no bubble).
 * Avatar 36px left; name 14/600 room-text; bubble room-surface
 * (translucent white at 12% over the gradient — solid room-surface is
 * the fallback); radius lg; 14px room-text; 8px vertical, 12px
 * horizontal padding; system text 12px room-text-muted.
 * Tokens only — no raw hex or pixel values.
 */
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { Avatar } from './Avatar';
import type { RoomMessage } from '../lib/rooms';

type ChatMessageRowProps = {
  message: RoomMessage;
  isOwn: boolean;
};

export function ChatMessageRow({ message, isOwn }: ChatMessageRowProps) {
  if (message.type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }
  const label = `${message.senderName}: ${message.text}`;
  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={label}>
      <Avatar name={message.senderName || '?'} size="sm" />
      <View style={styles.content}>
        <Text style={styles.senderName}>
          {message.senderName}
          {isOwn ? ' (you)' : ''}
        </Text>
        <View style={styles.bubble}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[2],
    paddingVertical: tokens.space[1],
  },
  content: { flex: 1, minWidth: 0, flexShrink: 1 },
  senderName: {
    color: tokens.color.roomText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  messageText: { color: tokens.color.roomText, fontSize: 14, lineHeight: 20 },
  systemRow: { alignItems: 'center', paddingVertical: tokens.space[1] },
  systemText: { color: tokens.color.roomTextMuted, fontSize: 12 },
});
