/**
 * TextInput — primitive (replica-design spec).
 * Variants: text, password, search, numeric, multiline.
 * Height 48 (multiline grows, min 96). Error state shows a message below.
 * Tokens only — no raw hex or pixel values.
 */
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../theme/tokens';

export type TextInputVariant =
  | 'text'
  | 'password'
  | 'search'
  | 'numeric'
  | 'multiline';

type TextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label: string;
  variant?: TextInputVariant;
  error?: string | null;
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
};

const KEYBOARD: Record<TextInputVariant, KeyboardTypeOptions> = {
  text: 'default',
  password: 'default',
  search: 'default',
  numeric: 'number-pad',
  multiline: 'default',
};

export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  variant = 'text',
  error,
  editable = true,
  maxLength,
  autoCapitalize = 'sentences',
  style,
}: TextInputProps) {
  const multiline = variant === 'multiline';
  return (
    <View style={style}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.color.textMuted}
        accessibilityLabel={label}
        secureTextEntry={variant === 'password'}
        keyboardType={KEYBOARD[variant]}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        maxLength={maxLength}
        autoCapitalize={variant === 'password' ? 'none' : autoCapitalize}
        autoCorrect={false}
        style={[
          styles.input,
          multiline && styles.multiline,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
        ]}
      />
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: tokens.color.borderInput,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg,
    color: tokens.color.text,
    fontSize: tokens.type.base.size,
    paddingHorizontal: tokens.space[3],
  },
  multiline: {
    height: undefined,
    minHeight: 96,
    paddingVertical: tokens.space[3],
    textAlignVertical: 'top',
  },
  inputError: { borderColor: tokens.color.danger },
  inputDisabled: { opacity: 0.5 },
  errorText: {
    color: tokens.color.danger,
    fontSize: 13,
    marginTop: tokens.space[1],
  },
});
