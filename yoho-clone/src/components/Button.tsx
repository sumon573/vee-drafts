/**
 * Button — primitive (replica-design spec).
 * Variants: primary, secondary, ghost, danger, on-dark.
 * Sizes: sm 32, md 40, lg 48, xl 56 (primary CTA).
 * Tokens only — no raw hex or pixel values.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../theme/tokens';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'onDark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 48, xl: 56 };
const FONT: Record<ButtonSize, 'sm' | 'base'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'base',
  xl: 'base',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size] },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        variant === 'onDark' && styles.onDark,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger' || variant === 'onDark'
              ? tokens.color.onAccent
              : tokens.color.accent
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            { fontSize: tokens.type[FONT[size]].size },
            variant === 'primary' && styles.labelOnAccent,
            variant === 'secondary' && styles.labelDark,
            variant === 'ghost' && styles.labelAccent,
            variant === 'danger' && styles.labelOnAccent,
            variant === 'onDark' && styles.labelOnAccent,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
    minWidth: 44,
  },
  primary: { backgroundColor: tokens.color.accent },
  secondary: {
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: tokens.color.danger },
  onDark: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '600', textAlign: 'center' },
  labelOnAccent: { color: tokens.color.onAccent },
  labelDark: { color: tokens.color.text },
  labelAccent: { color: tokens.color.accent },
});
