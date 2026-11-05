/**
 * gamesPolishFlag — Batch 3 (Games polish, test app only).
 *
 * Flag: featureFlags/gamesPolish (boolean, default false / missing = off).
 * Flag off = today's behaviour: no chat bubbles over the board, no
 * Onlookers row, no winner trophy/coins. Flag on = the three Batch 3
 * elements render (each still hides itself when its server data is
 * missing — messages / spectators / winner — never a demo value).
 * The client only READS the flag (RTDB subscription, no polling, no
 * timer) and renders; all element data comes from the server.
 */
import { onValue, ref } from 'firebase/database';
import { database } from '@/src/config/firebase';

export const GAMES_POLISH_FLAG_PATH = 'featureFlags/gamesPolish';

/**
 * Subscribe to the Games Polish server flag. Calls back with false when
 * the node is missing, not a boolean, or the read errors — so a missing
 * flag can never switch the polish on or crash the screen.
 */
export function subscribeGamesPolishFlag(
  callback: (enabled: boolean) => void,
): () => void {
  return onValue(
    ref(database, GAMES_POLISH_FLAG_PATH),
    (snap) => {
      callback(snap.val() === true);
    },
    () => {
      callback(false);
    },
  );
}
