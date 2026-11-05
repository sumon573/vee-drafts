/**
 * RoomHeatPill — F3 Room Heat display (test app only).
 *
 * Shows the SERVER-computed heat score for one room (zap + formatted
 * number, e.g. "128", "1.2K"). Renders NOTHING unless the server flag
 * is on AND the server supplied a real number for this room — a missing
 * heat value hides the pill (never a 0 shown as a fake, never a crash).
 * No computation, no timer: the number comes straight from RTDB.
 */
import { memo } from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatHeat } from '../services/roomHeat';

type Props = {
  /** Server heat score for this room; null/undefined = hide. */
  heat?: number | null;
  /** Server flag featureFlags/roomHeat; false = hide. */
  enabled: boolean;
};

export default memo(function RoomHeatPill({ heat, enabled }: Props) {
  if (!enabled) return null;
  if (typeof heat !== 'number' || !Number.isFinite(heat)) return null;
  const label = formatHeat(heat);
  if (!label) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF4E5',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(234,88,12,0.35)',
      }}
    >
      <Feather name="zap" size={11} color="#EA580C" />
      <Text style={{ color: '#C2410C', fontSize: 12, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
});
