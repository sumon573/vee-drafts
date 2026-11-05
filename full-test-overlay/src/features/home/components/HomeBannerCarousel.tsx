/**
 * HomeBannerCarousel — Batch 2.1 (2026-11-05).
 *
 * Full-width 16:9 promo banner at the top of the voice room list.
 * Content comes from the server (`home_promo` slides) — Vee's REAL
 * features only (SVIP, Delicious). No slides = the component renders
 * nothing (never a demo banner).
 *
 * Dots are buttons: active = white pill 16px, inactive = 6px dot 50%.
 * Auto-scroll every `autoScrollMs` (server, clamped 4–10s in the
 * sanitizer). Heat justification for the ONE interval: it is a single
 * setInterval that (a) pauses while the user is touching/dragging the
 * carousel, (b) pauses when the app is backgrounded (AppState), (c)
 * never runs under reduced-motion, (d) never runs with < 2 slides, and
 * (e) is cleared on unmount. With one slide, or with reduced-motion on,
 * the banner is swipe-only — no timer at all.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  AppState,
  AccessibilityInfo,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { HomePromoSlide, BannerAction } from '../services/homePromoService';

// Vee's own gradient — dark navy #130D31 → gold tint (never YoHo's violet-cyan).
const GRADIENT_COLORS = ['#130D31', '#2A1F4D', '#8A6D1B'] as const;

type Props = {
  slides: HomePromoSlide[];
  autoScrollMs: number;
  onAction: (action: BannerAction) => void;
};

export default function HomeBannerCarousel({ slides, autoScrollMs, onAction }: Props) {
  const { width: screenW } = useWindowDimensions();
  const slideW = screenW - 32;
  const slideH = Math.round((slideW * 9) / 16);
  const listRef = useRef<FlatList<HomePromoSlide> | null>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [touching, setTouching] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReducedMotion(v);
      })
      .catch(() => {});
    const sub = AppState.addEventListener('change', (s) => {
      setAppActive(s === 'active');
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const next = (i + slides.length) % slides.length;
      indexRef.current = next;
      setIndex(next);
      try {
        listRef.current?.scrollToIndex({ index: next, animated: !reducedMotion });
      } catch {
        /* list not laid out yet — the next interval / swipe recovers */
      }
    },
    [slides.length, reducedMotion],
  );

  // The ONE interval in this batch: auto-scroll only when there is
  // something to scroll to, the user is not touching, the app is in
  // the foreground, and reduced-motion is off.
  useEffect(() => {
    if (slides.length < 2 || touching || !appActive || reducedMotion) return;
    const id = setInterval(() => {
      goTo(indexRef.current + 1);
    }, autoScrollMs);
    return () => clearInterval(id);
  }, [slides.length, touching, appActive, reducedMotion, autoScrollMs, goTo]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / slideW);
    if (i !== indexRef.current && i >= 0 && i < slides.length) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  if (slides.length === 0) return null;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => setTouching(true)}
        onScrollEndDrag={() => setTouching(false)}
        onMomentumScrollEnd={() => setTouching(false)}
        renderItem={({ item }) => (
          <View style={{ width: slideW, height: slideH }}>
            <LinearGradient
              colors={[...GRADIENT_COLORS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
            {/* Bottom scrim so headline + CTA stay readable over any art. */}
            <LinearGradient
              colors={['rgba(19,13,49,0)', 'rgba(19,13,49,0.72)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: slideH * 0.62 }}
            />
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 30 }}>
              <Text
                numberOfLines={1}
                style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 0.2 }}
              >
                {item.headline}
              </Text>
              {!!item.sub && (
                <Text
                  numberOfLines={2}
                  style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '600', marginTop: 3, lineHeight: 18 }}
                >
                  {item.sub}
                </Text>
              )}
              {!!item.ctaLabel && item.action !== 'none' && (
                <Pressable
                  onPress={() => onAction(item.action)}
                  hitSlop={6}
                  style={{ alignSelf: 'flex-start', marginTop: 10 }}
                >
                  <View
                    style={{
                      backgroundColor: '#E8B84B',
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: '#241A04', fontSize: 13, fontWeight: '800' }}>
                      {item.ctaLabel}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />
      {/* Dots are buttons: active = white pill 16px, inactive = 6px dot. */}
      {slides.length > 1 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {slides.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => goTo(i)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1} of ${slides.length}`}
            >
              <View
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === index ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
