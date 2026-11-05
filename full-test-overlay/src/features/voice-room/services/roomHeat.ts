/**
 * roomHeat — F3 Room Heat (test app only).
 *
 * The heat SCORE is computed server-side by the staging job
 * (C:\vee-api-staging\room-heat-job.cjs, every 5 min) and written to
 * staging RTDB: roomHeat/{roomId} (canonical) + roomList/{id}/heat +
 * rooms/{id}/info/heat (display mirrors). The client NEVER computes
 * heat and runs NO timer — it only reads the server number + the
 * server flag below, and formats the number for display.
 *
 * Flag: featureFlags/roomHeat (boolean, default false / missing = off).
 * Flag off = today's behaviour: no heat shown anywhere, no Hot tab,
 * default sort. Flag on = heat pills + Hot sort. Missing heat for a
 * room = the heat element is hidden (never 0 shown as a fake).
 */
import { onValue, ref } from 'firebase/database';
import { database } from '@/src/config/firebase';

export const ROOM_HEAT_FLAG_PATH = 'featureFlags/roomHeat';

/**
 * Subscribe to the Room Heat server flag. Calls back with false when
 * the node is missing, not a boolean, or the read errors — so a
 * missing flag can never switch heat on or crash the screen.
 */
export function subscribeRoomHeatFlag(
  callback: (enabled: boolean) => void,
): () => void {
  return onValue(
    ref(database, ROOM_HEAT_FLAG_PATH),
    (snap) => {
      callback(snap.val() === true);
    },
    () => {
      callback(false);
    },
  );
}

/**
 * Format a server heat score YoHo-style ("840K"): >= 1,000,000 -> "1.2M",
 * >= 1,000 -> "1.2K", else the plain integer. Non-finite input -> ''.
 */
export function formatHeat(heat: number): string {
  if (typeof heat !== 'number' || !Number.isFinite(heat)) return '';
  const v = Math.max(0, Math.round(heat));
  if (v >= 1000000) {
    const m = v / 1000000;
    return (m >= 100 ? String(Math.round(m)) : String(Math.round(m * 10) / 10)) + 'M';
  }
  if (v >= 1000) {
    const k = v / 1000;
    return (k >= 100 ? String(Math.round(k)) : String(Math.round(k * 10) / 10)) + 'K';
  }
  return String(v);
}
