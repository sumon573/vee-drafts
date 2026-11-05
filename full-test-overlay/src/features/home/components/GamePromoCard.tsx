/**
 * GamePromoCard — Batch 2.4 (2026-11-05).
 *
 * Promo card for Vee's featured game, below the banner and above the
 * room list. Vee's own game art (bundled games-delicious.png, never
 * YoHo's). The featured game is server-configured (`home_promo`
 * featuredGame) — the only game playable from Home is Delicious: it is
 * a GLOBAL game (one `delicious` node for the whole app, no room
 * needed), so "Play Now" opens the real Delicious sheet. Any other
 * configured game hides this card — never a dead CTA. (Ludo is
 * room-scoped and out of the visible hub on the boss's 2026-10-25
 * order; Fisher is display-only.)
 *
 * LIVE player count = distinct bettors in the current Delicious round
 * (`delicious/bets/{roundN}` keys, bot-written). No live data = the
 * count line is hidden, never a guessed number.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { subscribeDeliciousRound } from '@/src/features/voice-room/services/deliciousService';

type Props = {
  onPlay: () => void;
};

export default function GamePromoCard({ onPlay }: Props) {
  const [roundN, setRoundN] = useState<number | null>(null);
  const [bettors, setBettors] = useState<number | null>(null);

  useEffect(() => {
    return subscribeDeliciousRound((round) => {
      setRoundN(round && typeof round.n === 'number' ? round.n : null);
    });
  }, []);

  // Live bettor count for the current round only. Missing node / no
  // round = null (count line hidden, never a fake number).
  useEffect(() => {
    if (roundN == null) {
      setBettors(null);
      return;
    }
    let detach: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { ref, onValue } = await import('firebase/database');
        const { database } = await import('@/src/config/firebase');
        if (cancelled) return;
        detach = onValue(
          ref(database, `delicious/bets/${roundN}`),
          (snap) => {
            if (cancelled) return;
            setBettors(snap.exists() ? Object.keys(snap.val() as object).length : 0);
          },
          () => {
            if (!cancelled) setBettors(null);
          },
        );
      } catch {
        if (!cancelled) setBettors(null);
      }
    })();
    return () => {
      cancelled = true;
      try {
        detach?.();
      } catch {
        /* non-critical */
      }
    };
  }, [roundN]);

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232,184,75,0.35)',
      }}
    >
      <LinearGradient
        colors={['#130D31', '#2A1F4D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
      >
        {/* Vee's own Delicious art (bundled asset, same as the game hub). */}
        <Image
          source={require('@/assets/images/games-delicious.png')}
          style={{ width: 76, height: 76, borderRadius: 12 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>
            Delicious
          </Text>
          <Text
            style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2, lineHeight: 16 }}
            numberOfLines={2}
          >
            Bet on your favourite food — real diamonds, every round.
          </Text>
          {bettors !== null && bettors > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#34C759' }}
              />
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>
                {bettors} playing now
              </Text>
            </View>
          )}
          <Pressable onPress={onPlay} hitSlop={6} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#E8B84B',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                gap: 6,
              }}
            >
              <Feather name="play" size={13} color="#241A04" />
              <Text style={{ color: '#241A04', fontSize: 13, fontWeight: '800' }}>Play Now</Text>
            </View>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}
