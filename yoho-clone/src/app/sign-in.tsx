/**
 * S03 Sign-in / Login (recon S03, design spec: Sign-in buttons).
 * Email + password (working) and Google (wired; needs the clone's OAuth
 * client ID — see auth.tsx). Facebook / TikTok / SMS are a later auth
 * milestone and are NOT shown as dead buttons.
 * "Can't login?" recovery is a later milestone (needs Resend).
 * All labels are the clone's own words.
 */
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { tokens } from '../theme/tokens';

export default function SignIn() {
  const { signIn, signUp, signInWithGoogle, authError, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    clearError();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        router.replace('/profile-setup');
      } else {
        await signIn(email, password);
        router.replace('/');
      }
    } catch {
      // authError from context is shown below
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    clearError();
    setFormError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch {
      // authError from context is shown below
    } finally {
      setBusy(false);
    }
  };

  const error = formError ?? authError;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to join live voice rooms.'
            : 'Create an account to join live voice rooms.'}
        </Text>

        <Button
          label="Continue with Google"
          onPress={google}
          variant="secondary"
          size="lg"
          disabled={busy}
          style={styles.googleButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          variant="password"
          style={styles.field}
        />

        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button
          label={mode === 'signin' ? 'Sign in' : 'Create account'}
          onPress={submit}
          variant="primary"
          size="xl"
          loading={busy}
          style={styles.submitButton}
        />

        <Button
          label={
            mode === 'signin'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'
          }
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            clearError();
            setFormError(null);
          }}
          variant="ghost"
          size="md"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: tokens.space[4],
    gap: tokens.space[3],
  },
  title: {
    fontSize: tokens.type.display.size,
    lineHeight: tokens.type.display.line,
    fontWeight: '700',
    color: tokens.color.text,
  },
  subtitle: { fontSize: tokens.type.base.size, color: tokens.color.textMuted },
  googleButton: { marginTop: tokens.space[3] },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginVertical: tokens.space[2],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: tokens.color.border },
  dividerText: { color: tokens.color.textMuted, fontSize: tokens.type.sm.size },
  field: { marginTop: tokens.space[1] },
  errorText: { color: tokens.color.danger, fontSize: tokens.type.sm.size },
  submitButton: { marginTop: tokens.space[2] },
});
