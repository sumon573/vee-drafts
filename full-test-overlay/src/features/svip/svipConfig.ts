/**
 * svipConfig — Vee SVIP membership configuration (2026-10-19).
 *
 * SVIP = Vee's paid premium membership, modeled on IMO's SVIP:
 * tiered levels with badge icon + nameplate icon + room privileges.
 *
 * PRICING (boss 2026-11-02): SVIP 1 = 10,000 / SVIP 2 = 20,000 /
 * SVIP 3 = 30,000 / SVIP 4 = 40,000 / SVIP 5 = 60,000 diamonds, 30 days.
 * PAYMENT METHOD (boss 2026-11-02): wallet diamonds. No staging-verified
 * SVIP purchase endpoint exists yet, so the Join CTA still joins the
 * waitlist (honestly labeled) until that endpoint ships.
 * NOTE: T4/T5 carry NO new enforced privileges (boss: do not invent) —
 * they show the accumulated set. T4/T5 pointsGranted carry the T3 value
 * (800) until the boss sets real values; purchase is not wired, so this
 * is dormant config.
 * Tiers 6 (Baron) + 7 (Duke) (F7, 2026-11-05): priceDiamonds 0 =
 * not for sale, privileges = SVIP 5 set, pointsGranted 0 — all pending
 * boss values, DO NOT INVENT.
 *
 * FULLY SERVER-DRIVEN (F8, 2026-11-05, boss: "Svip পুরোটা সার্ভার এর হবে"):
 * there are NO hardcoded tier/privilege values in this file any more.
 * The RTDB node `svip_config` is the ONLY source — tiers, privileges,
 * prices, durations, points. When it is absent the getters return []
 * (fail closed: no tier shown, no privilege granted, never a demo value).
 * Entries are sanitized; invalid ones are skipped, never a crash.
 *
 * 2026-10-24 (Sumon): the override is now actually IMPLEMENTED below
 * (loadServerSvipConfig, called at startup from AuthContext). RTDB
 * shape: svip_config = { tiers: SvipTier[], privileges: SvipPrivilegeDef[] }.
 * Either array may be omitted; entries are sanitized, invalid ones are
 * skipped, and anything missing falls back to the hardcoded values here.
 */

export interface SvipTier {
  /** 1-based tier level (matches IMO's svip_level) */
  tier: number;
  name: string;
  /** Brand color for the tier */
  color: string;
  /** ⚠️ PLACEHOLDER — boss sets real price. 0 = not for sale yet. */
  priceDiamonds: number;
  /** Duration in days per purchase */
  durationDays: number;
  /** Privilege keys unlocked at this tier (see SVIP_PRIVILEGES) */
  privileges: string[];
  /** SVIP Points granted on purchase (proportional to tier value) */
  pointsGranted: number;
}

export interface SvipPrivilegeDef {
  key: string;
  name: string;
  icon: string;
  /** First tier (1-based) that grants this privilege */
  minTier: number;
  /** False when no real code path enforces it yet — shows locked, never dead */
  enforced: boolean;
  /** TODO note for the stubbed ones */
  todo?: string;
  /** Optional privilege art URL (server-driven); icon text is the fallback. */
  art?: string;
}

/** Highest tier whose privileges the given tier includes. */
export function privilegesForTier(tier: number): SvipPrivilegeDef[] {
  return getSvipPrivileges().filter((p) => tier >= p.minTier);
}

/* ─────────────────────────────────────────────────────────────
 * 2026-10-24 (Sumon): SERVER-DRIVEN SVIP config.
 * Loaded once at startup (AuthContext). Server arrays REPLACE the
 * hardcoded ones wholesale per-array (tiers / privileges), after
 * sanitizing — a malformed server entry can never crash the app.
 * 2026-11-05 (F8): the hardcoded arrays are GONE — the server is the
 * only source. No server data = [] (fail closed, never demo values).
 * ───────────────────────────────────────────────────────────── */

let serverTiers: SvipTier[] | null = null;
let serverPrivileges: SvipPrivilegeDef[] | null = null;
let svipLoadAttempted = false;

/** Server tiers only — [] when the server config has not loaded. */
export function getSvipTiers(): SvipTier[] {
  return serverTiers ?? [];
}

/** Server privileges only — [] when the server config has not loaded. */
export function getSvipPrivileges(): SvipPrivilegeDef[] {
  return serverPrivileges ?? [];
}

export function sanitizeTier(raw: any): SvipTier | null {
  if (!raw || typeof raw !== 'object') return null;
  const tier = Number(raw.tier);
  if (!Number.isFinite(tier) || tier < 1) return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  return {
    tier: Math.floor(tier),
    name: raw.name.trim(),
    // No colour on the server = no colour (renderer does not use it).
    color: typeof raw.color === 'string' && raw.color ? raw.color : '',
    priceDiamonds: Number.isFinite(Number(raw.priceDiamonds)) && Number(raw.priceDiamonds) >= 0
      ? Math.floor(Number(raw.priceDiamonds)) : 0,
    // 0 = not supplied by the server (renderer never shows a duration
    // it did not get; the buy-bar suffix comes from svip_page).
    durationDays: Number.isFinite(Number(raw.durationDays)) && Number(raw.durationDays) > 0
      ? Math.floor(Number(raw.durationDays)) : 0,
    privileges: Array.isArray(raw.privileges) ? raw.privileges.map((p: any) => String(p)) : [],
    pointsGranted: Number.isFinite(Number(raw.pointsGranted)) && Number(raw.pointsGranted) >= 0
      ? Math.floor(Number(raw.pointsGranted)) : 0,
  };
}

export function sanitizePrivilege(raw: any): SvipPrivilegeDef | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.key !== 'string' || !raw.key.trim()) return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  const minTier = Number(raw.minTier);
  const out: SvipPrivilegeDef = {
    key: raw.key.trim(),
    name: raw.name.trim(),
    icon: typeof raw.icon === 'string' && raw.icon ? raw.icon : '',
    minTier: Number.isFinite(minTier) && minTier >= 1 ? Math.floor(minTier) : 1,
    enforced: raw.enforced === true,
    todo: typeof raw.todo === 'string' ? raw.todo : undefined,
  };
  if (typeof raw.art === 'string' && raw.art.startsWith('https://')) out.art = raw.art;
  return out;
}

export function toArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    // RTDB may return arrays as numeric-keyed objects
    return Object.keys(val).sort((a, b) => Number(a) - Number(b)).map((k) => val[k]);
  }
  return [];
}

export async function loadServerSvipConfig(): Promise<void> {
  if (svipLoadAttempted) return;
  svipLoadAttempted = true;
  try {
    const { ref, get } = await import('firebase/database');
    const { database } = await import('@/src/config/firebase');
    const snap = await get(ref(database, 'svip_config'));
    if (!snap.exists()) return;
    const data = snap.val();
    if (!data || typeof data !== 'object') return;
    const tiers = toArray(data.tiers).map(sanitizeTier).filter(Boolean) as SvipTier[];
    if (tiers.length > 0) serverTiers = tiers.sort((a, b) => a.tier - b.tier);
    const privs = toArray(data.privileges).map(sanitizePrivilege).filter(Boolean) as SvipPrivilegeDef[];
    if (privs.length > 0) serverPrivileges = privs;
  } catch {
    // No server data — getters return [] (fail closed, never demo values).
  }
}

/**
 * Live subscription to `svip_config` (F8): the SVIP screen renders
 * from this, so a server edit reflects without restart. Sanitised;
 * an empty/malformed node yields empty arrays (fail closed).
 */
export function subscribeSvipConfig(
  cb: (v: { tiers: SvipTier[]; privileges: SvipPrivilegeDef[] }) => void,
  onError?: (e: unknown) => void,
): () => void {
  let detach: (() => void) | null = null;
  let cancelled = false;
  (async () => {
    try {
      const { ref, onValue } = await import('firebase/database');
      const { database } = await import('@/src/config/firebase');
      if (cancelled) return;
      detach = onValue(
        ref(database, 'svip_config'),
        (snap) => {
          if (cancelled) return;
          const data = snap.val();
          if (!data || typeof data !== 'object') {
            cb({ tiers: [], privileges: [] });
            return;
          }
          const tiers = toArray(data.tiers).map(sanitizeTier).filter(Boolean) as SvipTier[];
          const privs = toArray(data.privileges).map(sanitizePrivilege).filter(Boolean) as SvipPrivilegeDef[];
          cb({
            tiers: tiers.sort((a, b) => a.tier - b.tier),
            privileges: privs,
          });
        },
        (e) => onError?.(e),
      );
    } catch (e) {
      if (!cancelled) onError?.(e);
    }
  })();
  return () => {
    cancelled = true;
    try { detach?.(); } catch { /* non-critical */ }
  };
}
