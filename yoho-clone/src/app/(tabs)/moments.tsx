/**
 * Moments — stub (recon S13). The Moments feed is a should-have
 * (milestone 3), not part of the vertical slice. This is a shell page
 * per replica-build step 1 (stub pages are fine for the shell); it is
 * not a fake feed — it says plainly what is next.
 */
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export default function Moments() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Moments</Text>
      <Text style={styles.text}>
        The Moments feed comes after the voice-room core loop is proven.
      </Text>
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
  title: {
    fontSize: tokens.type.xl.size,
    fontWeight: '700',
    color: tokens.color.text,
  },
  text: {
    fontSize: tokens.type.base.size,
    color: tokens.color.textMuted,
    textAlign: 'center',
  },
});
