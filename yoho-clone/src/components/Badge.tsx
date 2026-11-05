/**
 * Badge / Chip — primitive (replica-design spec).
 * Topic tag (soft chip: Chat teal, Sing sky, Dating rose, Party amber),
 * count chip (white text on dark scrim), status chip (LIVE / Full / Ended).
 * A badge's meaning never relies on colour alone — always an icon/label.
 * Tokens only — no raw hex or pixel values.
 */
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

export type TopicTag = 'Chat' | 'Sing' | 'Dating' | 'Party';
export type BadgeKind = 'topic' | 'count' | 'live' | 'full' | 'ended';

type BadgeProps = {
  kind: BadgeKind;
  label: string;
  topic?: TopicTag;
};

const TOPIC_STYLE: Record<
  TopicTag,
  { bg: string; text: string }
> = {
  Chat: { bg: tokens.color.tagChatBg, text: tokens.color.tagChatText },
  Sing: { bg: tokens.color.tagSingBg, text: tokens.color.tagSingText },
  Dating: { bg: tokens.color.tagDatingBg, text: tokens.color.tagDatingText },
  Party: { bg: tokens.color.tagPartyBg, text: tokens.color.tagPartyText },
};

export function Badge({ kind, label, topic = 'Chat' }: BadgeProps) {
  if (kind === 'topic') {
    const t = TOPIC_STYLE[topic];
    return (
      <View style={[styles.chip, { backgroundColor: t.bg }]}>
        <Text style={[styles.chipText, { color: t.text }]}>{label}</Text>
      </View>
    );
  }
  if (kind === 'count') {
    return (
      <View style={[styles.chip, styles.countChip]}>
        <Text style={[styles.chipText, styles.countText]}>{label}</Text>
      </View>
    );
  }
  if (kind === 'live') {
    return (
      <View style={[styles.chip, styles.liveChip]}>
        <View style={styles.liveDot} />
        <Text style={[styles.chipText, styles.liveText]}>{label}</Text>
      </View>
    );
  }
  // full / ended
  return (
    <View style={[styles.chip, styles.statusChip]}>
      <Text style={[styles.chipText, styles.statusText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 24,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  countChip: { backgroundColor: tokens.color.overlay, height: 20 },
  countText: { color: '#ffffff' },
  liveChip: { backgroundColor: tokens.color.danger, flexDirection: 'row' },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: tokens.space[1],
  },
  liveText: { color: '#ffffff' },
  statusChip: { backgroundColor: tokens.color.surface2 },
  statusText: { color: tokens.color.textMuted },
});
