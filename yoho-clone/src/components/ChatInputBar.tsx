/**
 * ChatInputBar — voice room input (replica-design spec).
 * Pill input (44px, room-surface bg) + circular icon buttons (44px,
 * room-surface bg, room-text icons). The gift button uses accent bg
 * (it is the money action and must stand out). The mic button shows a
 * small accent dot when voice filters are available but not unlocked
 * (it hints the filter flow exists instead of hiding it behind a
 * 6-step long-press).
 * Tokens only — no raw hex or pixel values.
 */
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { tokens } from '../theme/tokens';

type ChatInputBarProps = {
  onSend: (text: string) => void;
  onToggleMute: () => void;
  isMuted: boolean;
  filtersAvailable?: boolean;
  onGiftPress?: () => void;
};

export function ChatInputBar({
  onSend,
  onToggleMute,
  isMuted,
  filtersAvailable = false,
  onGiftPress,
}: ChatInputBarProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.bar}>
      <RNTextInput
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={tokens.color.roomTextMuted}
        accessibilityLabel="Message"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={send}
        returnKeyType="send"
        style={[styles.input, focused && styles.inputFocused]}
      />
      <Pressable
        onPress={onGiftPress}
        accessibilityRole="button"
        accessibilityLabel="Send a gift"
        style={[styles.iconButton, styles.giftButton]}
      >
        <Text style={styles.iconText}>🎁</Text>
      </Pressable>
      <Pressable
        onPress={onToggleMute}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        style={styles.iconButton}
      >
        <Text style={styles.iconText}>{isMuted ? '🔇' : '🎙️'}</Text>
        {filtersAvailable && !isMuted ? <View style={styles.filterDot} /> : null}
      </Pressable>
      <Pressable
        onPress={send}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={[styles.iconButton, styles.sendButton]}
      >
        <Text style={styles.iconText}>➤</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.roomSurface,
    color: tokens.color.roomText,
    fontSize: tokens.type.base.size,
    paddingHorizontal: tokens.space[3],
    minWidth: 0,
  },
  inputFocused: { borderWidth: 1, borderColor: tokens.color.accent },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.color.roomSurface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  giftButton: { backgroundColor: tokens.color.accent },
  sendButton: { backgroundColor: tokens.color.accent },
  iconText: { fontSize: 20, color: tokens.color.roomText },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.color.accent,
  },
});
