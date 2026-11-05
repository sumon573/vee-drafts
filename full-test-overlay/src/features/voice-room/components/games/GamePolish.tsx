/**
 * GamePolish — Batch 3 (Games polish, test app only).
 *
 * Shared UI for the three YoHo-derived game elements, rebuilt in Vee's
 * own design language (gold #E8B84B on dark; Vee's own vector trophy —
 * never YoHo art, never YoHo copy):
 *   3.1 GameChatBubbles — latest room-chat messages floating over the
 *       board. pointerEvents="none" everywhere, so they can NEVER block
 *       the board or a move. Transform/opacity only; each bubble fades
 *       out ~4s after it appears (one-shot Animated.timing — no timer,
 *       no interval, no poll, no loop).
 *   3.2 OnlookersRow — "Onlookers" label (12px, muted) + spectator
 *       avatar row. Renders nothing when the spectator list is missing
 *       or empty — never a demo value, never a crash.
 *   3.3 WinnerCelebration — gold trophy (Vee's own SVG vector) + flying
 *       gold coins (transform/opacity only, ~3s, plays ONCE per winKey).
 *       Reduced-motion = static trophy + text announcement, no coins.
 *       The winner ALWAYS comes from the server game service (the
 *       caller passes winnerName/winKey from the game node) — this
 *       component never decides who won, and it never touches payouts.
 *
 * Every element is gated by the caller on the server flag
 * featureFlags/gamesPolish (see gamesPolishFlag.ts). Flag off = the
 * caller renders none of these, i.e. today's behaviour.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Text, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

export type GameChatBubbleMsg = {
  id: string;
  senderName: string;
  photoURL?: string | null;
  text: string;
};

export type GameSpectator = {
  uid: string;
  name: string;
  photoURL?: string | null;
};

/** One-shot reduced-motion read (no subscription, no polling). */
function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => setReduced(v))
      .catch(() => {});
  }, []);
  return reduced;
}

function initialOf(name: string): string {
  const c = (name || '?').trim().charAt(0).toUpperCase();
  return c || '?';
}

/** Small avatar: photo when the server gave one, initial letter otherwise. */
function MiniAvatar({ name, photoURL, size }: { name: string; photoURL?: string | null; size: number }) {
  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#3A3A3C' }}
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: '#E8B84B', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#241A04', fontSize: size * 0.5, fontWeight: '900' }}>{initialOf(name)}</Text>
    </View>
  );
}

// ── 3.1 Chat bubbles over the board ──────────────────────────────────────────

function ChatBubble({ msg, reduceMotion }: { msg: GameChatBubbleMsg; reduceMotion: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.setValue(1);
    if (reduceMotion) return undefined;
    // One-shot fade: visible ~4s, then out over 0.8s. This is the
    // spec-justified animation (transform/opacity only); it is NOT a
    // timer/interval/poll — the Animated driver owns the timing.
    const anim = Animated.timing(opacity, {
      toValue: 0, delay: 4000, duration: 800, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [msg.id, opacity, reduceMotion]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        opacity,
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        maxWidth: '92%', backgroundColor: 'rgba(0,0,0,0.68)',
        borderRadius: 16, paddingVertical: 5, paddingHorizontal: 8, gap: 6,
      }}
    >
      <MiniAvatar name={msg.senderName} photoURL={msg.photoURL} size={22} />
      <Text numberOfLines={2} style={{ color: '#FFF', fontSize: 12, fontWeight: '600', flexShrink: 1 }}>
        <Text style={{ fontWeight: '800' }}>{msg.senderName}: </Text>
        {msg.text}
      </Text>
    </Animated.View>
  );
}

/**
 * Latest room-chat messages as floating bubbles. The parent places this
 * inside an absolute, pointerEvents="none" wrapper over the board.
 * Renders nothing when disabled or when there is no message (never a
 * demo bubble). Shows at most the latest 2 messages.
 */
export function GameChatBubbles({ messages, enabled }: { messages: GameChatBubbleMsg[]; enabled: boolean }) {
  const reduceMotion = useReduceMotion();
  if (!enabled || !messages || messages.length === 0) return null;
  const latest = messages.slice(-2);
  return (
    <View pointerEvents="none" style={{ gap: 6, alignItems: 'flex-start' }}>
      {latest.map((m) => (
        <ChatBubble key={m.id} msg={m} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

// ── 3.2 Onlookers spectator label + avatar row ───────────────────────────────

const ONLOOKER_MAX_SHOWN = 8;

/**
 * "Onlookers" label (12px, muted) + spectator avatar row below the board.
 * Spectators come from the game session / room presence (server data,
 * passed in by the caller). Missing or empty list = renders nothing.
 * `dark` matches the dark-red Delicious panel; default is the light Ludo board.
 */
export function OnlookersRow({
  spectators, enabled, dark,
}: {
  spectators: GameSpectator[];
  enabled: boolean;
  dark?: boolean;
}) {
  if (!enabled || !spectators || spectators.length === 0) return null;
  const shown = spectators.slice(0, ONLOOKER_MAX_SHOWN);
  const extra = spectators.length - shown.length;
  const labelColor = dark ? 'rgba(255,255,255,0.6)' : '#8E8E93';
  return (
    <View style={{ marginTop: 10, alignSelf: 'stretch' }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: labelColor }}>
        Onlookers{` (${spectators.length})`}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
        {shown.map((s) => (
          <View key={s.uid} style={{ alignItems: 'center', width: 34 }}>
            <MiniAvatar name={s.name} photoURL={s.photoURL} size={28} />
            <Text numberOfLines={1} style={{ fontSize: 9, color: labelColor, marginTop: 2, textAlign: 'center', width: 34 }}>
              {s.name}
            </Text>
          </View>
        ))}
        {extra > 0 && (
          <View
            style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: dark ? '#3D0A0A' : '#F2F2F7',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: dark ? '#FFD43B88' : '#E5E5EA',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: dark ? '#FFD43B' : '#555' }}>+{extra}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── 3.3 Winner trophy + flying gold coins ────────────────────────────────────

/** Vee's own gold trophy, drawn as vector (never YoHo art, never an image). */
export function GoldTrophy({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* handles */}
      <Path d="M12 12 C4 12 4 24 12 26 C14 26 15 25 15 23 L15 16 C15 14 14 12 12 12 Z" fill="#E8B84B" />
      <Path d="M52 12 C60 12 60 24 52 26 C50 26 49 25 49 23 L49 16 C49 14 50 12 52 12 Z" fill="#E8B84B" />
      {/* cup */}
      <Path
        d="M14 8 H50 V22 C50 33 42 41 32 41 C22 41 14 33 14 22 Z"
        fill="#F6D67C" stroke="#B8862A" strokeWidth={2}
      />
      {/* rank "1" baked into the cup, like the reference */}
      <SvgText x={32} y={32} fontSize={20} fontWeight="900" fill="#B8862A" textAnchor="middle">1</SvgText>
      {/* stem + base */}
      <Path d="M28 41 H36 V50 H28 Z" fill="#E8B84B" />
      <Path d="M20 50 H44 V56 H20 Z" fill="#E8B84B" stroke="#B8862A" strokeWidth={1.5} />
      <Path d="M16 56 H48 V60 H16 Z" fill="#B8862A" />
    </Svg>
  );
}

// Deterministic coin flight paths (index-derived, never random at render):
// each coin rises a different height and drifts left/right, then fades.
const COIN_COUNT = 10;
const COIN_FLIGHT: Array<{ dx: number; dy: number; size: number }> = Array.from(
  { length: COIN_COUNT },
  (_, i) => ({
    dx: (i % 2 === 0 ? 1 : -1) * (18 + ((i * 23) % 52)),
    dy: 90 + ((i * 37) % 90),
    size: 12 + (i % 3) * 3,
  }),
);

function FlyingCoin({ progress, flight }: { progress: Animated.Value; flight: { dx: number; dy: number; size: number } }) {
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -flight.dy] });
  const translateX = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, flight.dx * 0.6, flight.dx] });
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.5, 1, 0.9] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: -flight.size / 2, top: -flight.size / 2,
        width: flight.size, height: flight.size, borderRadius: flight.size / 2,
        backgroundColor: '#F6D67C', borderWidth: 1.5, borderColor: '#B8862A',
        alignItems: 'center', justifyContent: 'center',
        opacity, transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <View style={{ width: flight.size * 0.45, height: flight.size * 0.45, borderRadius: flight.size * 0.225, backgroundColor: '#E8B84B' }} />
    </Animated.View>
  );
}

/**
 * Winner celebration. `winKey` identifies one win (e.g. game id +
 * winner uid, or Delicious round number): the coins fly ONCE per
 * winKey, ~3s, transform/opacity only. Reduced-motion = static trophy
 * + text announcement, no coins. `coins=false` = static trophy only
 * (used when celebrating someone else's win).
 * The caller decides the winner from the SERVER game service; this
 * component only renders it. Never touches payouts.
 */
export function WinnerCelebration({
  winnerName, winKey, coins = true, trophySize = 84,
}: {
  winnerName: string | null;
  winKey: string;
  coins?: boolean;
  trophySize?: number;
}) {
  const reduceMotion = useReduceMotion();
  const progresses = useRef<Animated.Value[] | null>(null);
  if (progresses.current == null) {
    progresses.current = COIN_FLIGHT.map(() => new Animated.Value(0));
  }
  const playCoins = coins && !reduceMotion;
  useEffect(() => {
    if (!playCoins || !progresses.current) return undefined;
    const anims = progresses.current.map((p, i) => {
      p.setValue(0);
      return Animated.timing(p, {
        toValue: 1, delay: i * 110, duration: 2800, useNativeDriver: true,
      });
    });
    const parallel = Animated.parallel(anims);
    parallel.start();
    return () => parallel.stop();
  }, [winKey, playCoins]);
  if (!winnerName) return null;
  return (
    <View
      style={{ alignItems: 'center' }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${winnerName} won the game`}
    >
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <GoldTrophy size={trophySize} />
        {playCoins && progresses.current && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: trophySize * 0.55, width: 0, height: 0 }}>
            {COIN_FLIGHT.map((flight, i) => (
              <FlyingCoin key={`${winKey}-${i}`} progress={progresses.current![i]} flight={flight} />
            ))}
          </View>
        )}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#B8862A', marginTop: 6, textAlign: 'center' }}>
        {winnerName} won!
      </Text>
    </View>
  );
}
