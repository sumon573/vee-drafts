/**
 * Avatar — primitive (replica-design spec).
 * Variants: plain, speaking (halo), muted (mic-off badge).
 * Sizes: xs 24, sm 36, md 48, lg 64, xl 96, xxl 110.
 * The avatar image is the user's photo (or initials when none).
 * Tokens only — no raw hex or pixel values.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const SIZE: Record<AvatarSize, number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
  xxl: 110,
};

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  speaking?: boolean;
  muted?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
  return (first + second).toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  size = 'md',
  speaking = false,
  muted = false,
}: AvatarProps) {
  const px = SIZE[size];
  const label = muted
    ? `${name}, muted`
    : speaking
      ? `${name}, speaking`
      : name;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.wrap, { width: px, height: px }, speaking && styles.speaking]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: px, height: px, borderRadius: px / 2 }]}
          accessibilityLabel={label}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: px, height: px, borderRadius: px / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: Math.max(10, px * 0.36) }]}>
            {initials(name)}
          </Text>
        </View>
      )}
      {muted ? (
        <View style={styles.mutedBadge} accessibilityLabel="Muted">
          <Text style={styles.mutedText}>✕</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  speaking: {
    borderWidth: 2,
    borderColor: tokens.color.roomGlow,
    borderRadius: 999,
  },
  image: { backgroundColor: tokens.color.surface2 },
  fallback: {
    backgroundColor: tokens.color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: tokens.color.accent, fontWeight: '700' },
  mutedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.color.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});
