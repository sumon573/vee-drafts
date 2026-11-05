/**
 * Me — stub profile (recon S19). The full profile (wallet, VIP, missions,
 * settings) is a must-have / should-have (milestones 2-3), not part of
 * the vertical slice. This shell page shows the signed-in user and a
 * sign-out action so the slice can be exited cleanly.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { tokens } from '../../theme/tokens';

export default function Me() {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.root}>
      <Avatar name={user?.nickname ?? 'You'} size="xxl" />
      <Text style={styles.name}>{user?.nickname ?? 'You'}</Text>
      <Text style={styles.email}>{user?.email ?? ''}</Text>
      <Text style={styles.note}>
        Wallet, VIP, missions and settings come after the voice-room core
        loop is proven.
      </Text>
      <Button label="Sign out" onPress={() => void signOut()} variant="secondary" size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[4],
    gap: tokens.space[2],
  },
  name: {
    fontSize: tokens.type.xl.size,
    fontWeight: '700',
    color: tokens.color.text,
  },
  email: { fontSize: tokens.type.base.size, color: tokens.color.textMuted },
  note: {
    fontSize: tokens.type.sm.size,
    color: tokens.color.textMuted,
    textAlign: 'center',
    marginVertical: tokens.space[2],
  },
});
