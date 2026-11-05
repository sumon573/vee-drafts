/**
 * Batch1Polish — Voice room polish (Batch 1, YoHo design elements → Vee).
 * 2026-11-05. Test app ONLY (vee-drafts full-test-overlay).
 *
 * Elements (see ~/workspace/yoho-clone/vee-implementation/ANALYSIS.md §Batch 1):
 *   1.1 SpeakingHalo — gold speaking halo + radial glow, OVERLAY ring only.
 *       The Style A Glass Pod seat itself is LOCKED and untouched.
 *   1.2 ChatLevelBadge — Noble rank / SVIP tier pill next to chat names.
 *   1.3 RoomValueChips — diamond value + online count chips, room header.
 *   1.4 (gift prominence lives in VoiceRoomBottomBar — gold ring wrapper).
 *   1.5 MusicDiscIcon — small spinning vinyl disc, playing-only.
 *
 * Server flag: `featureFlags/batch1VoiceRoomPolish` in RTDB. The Screen
 * reads it ONCE (useBatch1VoiceRoomPolish) and passes booleans down; flag
 * off / missing / read error = today's behaviour everywhere. Missing
 * server DATA hides the element that needs it — never a demo value.
 *
 * Heat: NO new timers/intervals/polls. The halo pulse and the disc spin
 * are Animated loops on transform/opacity only (native driver). The
 * per-uid SVIP subscription is ref-counted (one shared onValue per uid,
 * same pattern as useNobleRank) so a long chat list adds no listeners.
 * Reduced motion: halo renders a static ring, the disc does not spin.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { ref, onValue } from 'firebase/database';
import { database } from '@/src/config/firebase';
import { useNobleRank } from '@/src/hooks/useNobleRank';
import { NOBLE_RANKS } from '@/src/services/nobleService';
import { getSvipTiers } from '@/src/features/svip/svipConfig';
import { DiamondIcon } from '@/src/components/DiamondIcon';

/** Vee gold — the polish accent (NOT YoHo's teal). */
export const BATCH1_GOLD = '#E8B84B';
export const BATCH1_GOLD_LIGHT = '#F6D67C';
export const BATCH1_GOLD_DARK = '#B8862A';

/** RTDB server flag node. Absent / false / unreadable = OFF. */
export const BATCH1_FLAG_PATH = 'featureFlags/batch1VoiceRoomPolish';

/**
 * Read the Batch 1 server flag once. One onValue for the whole room
 * screen; the Screen passes the boolean down to SeatCard / chat /
 * bottom bar so no child subscribes on its own.
 */
export function useBatch1VoiceRoomPolish(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let detach: (() => void) | null = null;
    try {
      detach = onValue(
        ref(database, BATCH1_FLAG_PATH),
        (snap) => setOn(snap.val() === true),
        () => setOn(false),
      );
    } catch {
      setOn(false);
    }
    return () => {
      try {
        detach?.();
      } catch {
        /* flag listener teardown is non-critical */
      }
    };
  }, []);
  return on;
}

/** True when the OS reduced-motion setting is on (halo/disc go static). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(!!v);
      })
      .catch(() => {
        /* unknown = animate (platform default) */
      });
    return () => {
      alive = false;
    };
  }, []);
  return reduced;
}

/* ─────────────────────── 1.1 Speaking halo + radial glow ───────────────────────
   OVERLAY ONLY, rendered inside the seat's avatar container (position:
   relative) with pointerEvents="none" so seat taps pass through untouched.
   - Inner ring: solid 2px gold, static, hugs the pod.
   - Outer ring: fades while expanding to 1.4x over 1600ms, loop.
     Transform/opacity only, native driver (same pattern as the event
     RippleRing in SeatCard).
   - Radial glow: SVG radial gradient disc behind the avatar, gold at
     25% peak opacity fading to transparent, with a soft dark edge so
     the room never reads flat around the speaker (the "vignette").
   Reduced motion: inner ring + glow only, no pulse. */

const HALO_INSET = -6;
const GLOW_SIZE = 112;

export function SpeakingHalo({ speaking, enabled }: { speaking: boolean; enabled: boolean }) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!speaking || !enabled || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, enabled, reduced, anim]);

  if (!speaking || !enabled) return null;

  const pulseScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] });

  return (
    <>
      {/* Radial glow behind the avatar (first child = painted behind). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          marginLeft: -GLOW_SIZE / 2,
          marginTop: -GLOW_SIZE / 2,
          zIndex: 0,
        }}
      >
        <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox={`0 0 ${GLOW_SIZE} ${GLOW_SIZE}`}>
          <Defs>
            <RadialGradient id="batch1HaloGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={BATCH1_GOLD} stopOpacity={0.25} />
              <Stop offset="55%" stopColor={BATCH1_GOLD} stopOpacity={0.1} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0.08} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#batch1HaloGlow)" />
        </Svg>
      </View>
      {/* Inner solid ring — 2px gold, static. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: HALO_INSET,
          left: HALO_INSET,
          right: HALO_INSET,
          bottom: HALO_INSET,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: BATCH1_GOLD,
          zIndex: 5,
        }}
      />
      {/* Outer fading ring — pulses to 1.4x; static when reduced motion. */}
      {reduced ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: HALO_INSET,
            left: HALO_INSET,
            right: HALO_INSET,
            bottom: HALO_INSET,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: BATCH1_GOLD,
            opacity: 0.35,
            zIndex: 5,
          }}
        />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: HALO_INSET,
            left: HALO_INSET,
            right: HALO_INSET,
            bottom: HALO_INSET,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: BATCH1_GOLD,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
            zIndex: 5,
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────── SVIP tier (ref-counted) ───────────────────────
   Same subscription-cache pattern as useNobleRank: one shared onValue
   per uid no matter how many chat rows render that user. Returns the
   ACTIVE tier (tier > 0 and not expired) or null. */

function parseSvipTier(val: unknown): number | null {
  if (!val || typeof val !== 'object') return null;
  const v = val as { tier?: unknown; expiry?: unknown };
  if (typeof v.tier !== 'number' || !Number.isFinite(v.tier) || v.tier <= 0) return null;
  if (typeof v.expiry !== 'number' || !Number.isFinite(v.expiry) || v.expiry <= Date.now()) return null;
  return Math.floor(v.tier);
}

interface SvipEntry {
  value: number | null;
  refCount: number;
  listeners: Set<(v: number | null) => void>;
  unsub: (() => void) | null;
}

const svipCache = new Map<string, SvipEntry>();

function ensureSvipSubscription(uid: string): SvipEntry {
  const existing = svipCache.get(uid);
  if (existing) return existing;
  const entry: SvipEntry = { value: null, refCount: 0, listeners: new Set(), unsub: null };
  entry.unsub = onValue(
    ref(database, `svip/${uid}`),
    (snap) => {
      const next = parseSvipTier(snap.val());
      if (next !== entry.value) {
        entry.value = next;
        for (const cb of entry.listeners) {
          try {
            cb(next);
          } catch {
            /* one bad listener must not break the rest */
          }
        }
      }
    },
    () => {
      if (entry.value !== null) {
        entry.value = null;
        for (const cb of entry.listeners) {
          try {
            cb(null);
          } catch {
            /* ignore */
          }
        }
      }
    },
  );
  svipCache.set(uid, entry);
  return entry;
}

export function useActiveSvipTier(uid: string | undefined | null): number | null {
  const [tier, setTier] = useState<number | null>(() => (uid ? svipCache.get(uid)?.value ?? null : null));
  useEffect(() => {
    if (!uid) {
      setTier(null);
      return;
    }
    const entry = ensureSvipSubscription(uid);
    entry.refCount += 1;
    entry.listeners.add(setTier);
    setTier(entry.value);
    return () => {
      entry.listeners.delete(setTier);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        try {
          entry.unsub?.();
        } catch {
          /* ignore */
        }
        svipCache.delete(uid);
      }
    };
  }, [uid]);
  return tier;
}

/* ─────────────────────── 1.2 Level / charm badge pill ───────────────────────
   20px tall, 11px/700, icon + number/text — never colour alone.
   SVIP wins when active ("SVIP n", gold); otherwise the Noble rank name
   ("Knight" … "King", the rank's own colour). No rank and no SVIP = hidden
   (never a demo pill). Vee's own art: a tiny SVG star (SVIP) / shield
   (Noble) — never YoHo's crown icon, never emoji. */

function StarMark({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.4 6.3 6.6.5-5 4.4 1.6 6.5L12 16.7l-5.6 3.5L8 13.7 3 9.3l6.6-.5L12 2.5Z"
        fill={color}
      />
    </Svg>
  );
}

function ShieldMark({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l7 2.8v5.2c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V5.3l7-2.8Z"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path d="M12 7.5v6M9.5 10.5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChatLevelBadge({ uid, enabled }: { uid?: string | null; enabled: boolean }) {
  // Flag off = ZERO new subscriptions: pass null uids so both hooks
  // no-op (their null path subscribes to nothing). Hook order stays
  // stable because both hooks are always called.
  const rankIndex = useNobleRank(enabled ? uid : null);
  const svipTier = useActiveSvipTier(enabled ? uid : null);
  if (!enabled) return null;

  if (svipTier !== null) {
    const tier = getSvipTiers().find((t) => t.tier === svipTier);
    const color = tier?.color ?? BATCH1_GOLD;
    return (
      <View
        style={{
          height: 20,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          gap: 3,
          backgroundColor: color + '1A',
          borderWidth: 1,
          borderColor: color,
          marginLeft: 4,
          flexShrink: 0,
        }}
      >
        <StarMark color={color} />
        <Text style={{ color, fontSize: 11, fontWeight: '700', lineHeight: 13 }}>
          {'SVIP ' + svipTier}
        </Text>
      </View>
    );
  }

  if (rankIndex !== null && rankIndex >= 0 && rankIndex < NOBLE_RANKS.length) {
    const rank = NOBLE_RANKS[rankIndex];
    return (
      <View
        style={{
          height: 20,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          gap: 3,
          backgroundColor: rank.color + '1A',
          borderWidth: 1,
          borderColor: rank.color,
          marginLeft: 4,
          flexShrink: 0,
        }}
      >
        <ShieldMark color={rank.color} />
        <Text style={{ color: rank.color, fontSize: 11, fontWeight: '700', lineHeight: 13 }}>
          {rank.name}
        </Text>
      </View>
    );
  }

  return null;
}

/* ─────────────────────── 1.3 Diamond + online chips ───────────────────────
   Translucent dark-scrim pills below the room title/ID: DiamondIcon
   (Vee's rose-pink "2", NOT YoHo's blue diamond) + the room's
   server-maintained gift total (rooms/{id}/info/totalDiamonds), and a
   person icon + the live online count (seated + audience). Tabular
   figures so digits never jump. A chip whose value is missing is
   hidden — never a demo number. Taps go to existing destinations
   (Leaderboard / Members). */

export function formatCompact(n: number): string {
  const trim = (v: number) => (v % 1 === 0 ? String(v) : v.toFixed(1).replace(/\.0$/, ''));
  if (n >= 1e9) return trim(n / 1e9) + 'b';
  if (n >= 1e6) return trim(n / 1e6) + 'm';
  if (n >= 1e3) return trim(n / 1e3) + 'k';
  return String(Math.floor(n));
}

const CHIP_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: 'rgba(0,0,0,0.45)',
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 5,
  gap: 5,
};

export function RoomValueChips({
  enabled,
  roomDiamonds,
  onlineCount,
  onDiamondPress,
  onOnlinePress,
}: {
  enabled: boolean;
  /** rooms/{id}/info/totalDiamonds — null when the room has none yet. */
  roomDiamonds: number | null;
  /** Live seated + audience count. */
  onlineCount: number;
  onDiamondPress: () => void;
  onOnlinePress: () => void;
}) {
  if (!enabled) return null;
  const showDiamond = typeof roomDiamonds === 'number' && Number.isFinite(roomDiamonds);
  if (!showDiamond && !(onlineCount > 0)) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {showDiamond && (
        <Pressable onPress={onDiamondPress}>
          <View style={CHIP_STYLE}>
            <DiamondIcon size={13} />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {formatCompact(roomDiamonds as number)}
            </Text>
          </View>
        </Pressable>
      )}
      {onlineCount > 0 && (
        <Pressable onPress={onOnlinePress}>
          <View style={CHIP_STYLE}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 11ZM5 20c.8-3.2 3.6-5 7-5s6.2 1.8 7 5"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {formatCompact(onlineCount)}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

/* ─────────────────────── 1.5 Music / vinyl disc ───────────────────────
   Vee's own vinyl disc (drawn Views/SVG — no YoHo art): black disc with
   groove rings, a gold centre label and a centre hole. 44dp, floating
   bottom-right above the bottom bar. Visible ONLY while music is
   actually playing in the room (server state); tap opens the music
   sheet. Spins slowly (one revolution / 12s, rotate transform only,
   native driver); static when reduced motion is on. */

const DISC_SIZE = 44;

export function MusicDiscIcon({
  playing,
  enabled,
  bottom,
  onPress,
}: {
  playing: boolean;
  enabled: boolean;
  /** Distance from the screen bottom (BOTTOM_BAR_H + 12). */
  bottom: number;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!playing || !enabled || reduced) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 12000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, enabled, reduced, spin]);

  if (!playing || !enabled) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 14,
        bottom,
        width: DISC_SIZE,
        height: DISC_SIZE,
        zIndex: 998,
        transform: [{ rotate }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          width: DISC_SIZE,
          height: DISC_SIZE,
          borderRadius: DISC_SIZE / 2,
          backgroundColor: '#111111',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
          shadowColor: '#000000',
          shadowOpacity: 0.4,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 6,
        }}
      >
        {/* Groove rings */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        />
        {/* Off-centre gold marker — the disc is round, so the spin is only
            visible through this marker travelling around the label. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 5,
            left: DISC_SIZE / 2 - 2,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: BATCH1_GOLD_LIGHT,
          }}
        />
        {/* Gold centre label + hole */}
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: BATCH1_GOLD,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#111111' }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
