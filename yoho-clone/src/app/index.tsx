/**
 * Entry gate (index).
 * - Auth still initialising -> loading state.
 * - No user -> sign-in (S03).
 * - User but no RTDB profile row -> profile setup (S04).
 * - User + profile -> Home tabs (S05).
 * (Mirror the shown flow: sign-in -> profile setup -> Home.)
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { tokens } from '../theme/tokens';

export default function Index() {
  const { user, initializing, hasProfile } = useAuth();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfileRow, setHasProfileRow] = useState(false);

  useEffect(() => {
    if (initializing || !user) return;
    let cancelled = false;
    hasProfile(user.uid)
      .then((exists) => {
        if (!cancelled) {
          setHasProfileRow(exists);
          setProfileChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setProfileChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initializing, user, hasProfile]);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.color.accent} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  if (!profileChecked) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.color.accent} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }
  if (!hasProfileRow) {
    return <Redirect href="/profile-setup" />;
  }
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.bg,
    gap: tokens.space[3],
  },
  loadingText: { color: tokens.color.textMuted, fontSize: tokens.type.sm.size },
});
