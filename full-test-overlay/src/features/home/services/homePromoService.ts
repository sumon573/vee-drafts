/**
 * homePromoService — Batch 2 (Home + Profile polish, 2026-11-05).
 *
 * Server-driven config for the Home banner carousel, game promo card,
 * topic chips, listener-chip waveform, profile gradient cover, profile
 * badges row and profile Gifts collection row.
 *
 * Source of truth: staging RTDB node `home_promo`. Read via a live
 * subscription (no polling). Missing / malformed node = everything OFF
 * (today's behaviour), never a demo value, never a crash.
 *
 * Config shape (all fields optional; anything missing = off):
 *   {
 *     enabled: boolean,                 // master kill-switch
 *     bannerEnabled: boolean,
 *     bannerAutoScrollMs: number,       // clamped 4000..10000, default 5000
 *     slides: [{ id, imageUrl?, headline, sub?, ctaLabel?, action }],
 *     gamePromoEnabled: boolean,
 *     featuredGame: 'delicious',        // ONLY 'delicious' is playable
 *                                        // from Home (global game, no room
 *                                        // needed). Any other value hides
 *                                        // the promo card — never a dead CTA.
 *     topicChipsEnabled: boolean,
 *     listenerWaveformEnabled: boolean,
 *     profileCoverEnabled: boolean,
 *     profileBadgesEnabled: boolean,
 *     profileGiftsEnabled: boolean,
 *   }
 * Slide action: 'svip' (open /svip) | 'delicious' (open the Delicious
 * sheet) | 'none' (no tap action). Unknown action = 'none'.
 */

export type BannerAction = 'svip' | 'delicious' | 'none';

export interface HomePromoSlide {
  id: string;
  /** Remote art URL (Vee's own art only). Missing = gradient slide. */
  imageUrl?: string;
  headline: string;
  sub?: string;
  ctaLabel?: string;
  action: BannerAction;
}

export interface HomePromoConfig {
  enabled: boolean;
  bannerEnabled: boolean;
  bannerAutoScrollMs: number;
  slides: HomePromoSlide[];
  gamePromoEnabled: boolean;
  featuredGame: string;
  topicChipsEnabled: boolean;
  listenerWaveformEnabled: boolean;
  profileCoverEnabled: boolean;
  profileBadgesEnabled: boolean;
  profileGiftsEnabled: boolean;
}

export const HOME_PROMO_OFF: HomePromoConfig = {
  enabled: false,
  bannerEnabled: false,
  bannerAutoScrollMs: 5000,
  slides: [],
  gamePromoEnabled: false,
  featuredGame: '',
  topicChipsEnabled: false,
  listenerWaveformEnabled: false,
  profileCoverEnabled: false,
  profileBadgesEnabled: false,
  profileGiftsEnabled: false,
};

const MAX_SLIDES = 6;
const MAX_HEADLINE = 60;
const MAX_SUB = 90;
const MAX_CTA = 20;

function isHttpsUrl(v: unknown): v is string {
  return typeof v === 'string' && /^https:\/\//i.test(v) && v.length <= 500;
}

function cleanStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  return s.length > max ? s.slice(0, max) : s;
}

function cleanSlide(raw: unknown): HomePromoSlide | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = cleanStr(r.id, 40);
  const headline = cleanStr(r.headline, MAX_HEADLINE);
  if (!id || !headline) return null;
  const actionRaw = cleanStr(r.action, 20);
  const action: BannerAction =
    actionRaw === 'svip' || actionRaw === 'delicious' ? actionRaw : 'none';
  const slide: HomePromoSlide = { id, headline, action };
  if (isHttpsUrl(r.imageUrl)) slide.imageUrl = r.imageUrl;
  const sub = cleanStr(r.sub, MAX_SUB);
  if (sub) slide.sub = sub;
  const ctaLabel = cleanStr(r.ctaLabel, MAX_CTA);
  if (ctaLabel) slide.ctaLabel = ctaLabel;
  return slide;
}

/** Validate + sanitize raw RTDB data. Anything malformed is dropped, never a crash. */
export function sanitizeHomePromo(raw: unknown): HomePromoConfig {
  if (!raw || typeof raw !== 'object') return HOME_PROMO_OFF;
  const r = raw as Record<string, unknown>;
  const enabled = r.enabled === true;
  const slidesRaw = Array.isArray(r.slides) ? r.slides : [];
  const slides: HomePromoSlide[] = [];
  for (const s of slidesRaw) {
    if (slides.length >= MAX_SLIDES) break;
    const clean = cleanSlide(s);
    if (clean) slides.push(clean);
  }
  const msRaw = typeof r.bannerAutoScrollMs === 'number' ? r.bannerAutoScrollMs : 5000;
  const bannerAutoScrollMs = Math.min(10000, Math.max(4000, Math.floor(msRaw)));
  return {
    enabled,
    bannerEnabled: enabled && r.bannerEnabled === true && slides.length > 0,
    bannerAutoScrollMs,
    slides,
    gamePromoEnabled: enabled && r.gamePromoEnabled === true,
    featuredGame:
      typeof r.featuredGame === 'string' ? r.featuredGame.trim().toLowerCase() : '',
    topicChipsEnabled: enabled && r.topicChipsEnabled === true,
    listenerWaveformEnabled: enabled && r.listenerWaveformEnabled === true,
    profileCoverEnabled: enabled && r.profileCoverEnabled === true,
    profileBadgesEnabled: enabled && r.profileBadgesEnabled === true,
    profileGiftsEnabled: enabled && r.profileGiftsEnabled === true,
  };
}

/**
 * Live subscription to `home_promo`. Callback fires on every server change
 * (flag kill needs no OTA). Detach with the returned function.
 * On error / missing node the callback receives HOME_PROMO_OFF.
 */
export function subscribeHomePromo(cb: (c: HomePromoConfig) => void): () => void {
  let detach: (() => void) | null = null;
  let cancelled = false;
  (async () => {
    try {
      const { ref, onValue } = await import('firebase/database');
      const { database } = await import('@/src/config/firebase');
      if (cancelled) return;
      detach = onValue(
        ref(database, 'home_promo'),
        (snap) => {
          if (cancelled) return;
          cb(snap.exists() ? sanitizeHomePromo(snap.val()) : HOME_PROMO_OFF);
        },
        () => {
          if (!cancelled) cb(HOME_PROMO_OFF);
        },
      );
    } catch {
      if (!cancelled) cb(HOME_PROMO_OFF);
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
}
