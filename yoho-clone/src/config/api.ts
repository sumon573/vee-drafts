/**
 * API base + LiveKit token fetch for the YoHo clone (vertical slice).
 *
 * The clone uses the EXISTING staging API on the VPS (VeeApiStaging, port
 * 3005, behind Caddy at /test-api) for the LiveKit token — the same endpoint
 * the Vee test app uses. It does NOT touch the production API.
 *
 * LiveKit token: POST {API_BASE}/api/livekit/token with
 *   Authorization: Bearer <Firebase ID token>
 *   body: { roomName, participantName, canPublish: true }
 * Response: { token, url } — url is the staging LiveKit WebSocket URL
 * (behind Caddy at /test-livekit, ports 7890-7892).
 *
 * Retries: transient failures (timeout / network / 5xx) up to 3 attempts
 * with 1s / 2.5s backoff; 4xx fails fast. (Same pattern as Vee's
 * useLivekitVoiceRoom — a single 20s attempt gives up forever on a
 * transient network dip.)
 */
import { auth } from './firebase';

/** Staging API base (VeeApiStaging on the VPS, behind Caddy /test-api). */
export const API_BASE = 'https://vee-club.duckdns.org/test-api';

export type LivekitTokenData = { token: string; url: string };

const TOKEN_TIMEOUT_MS = 20000;

/** Get the current Firebase ID token, bounded so a stalled Auth SDK cannot hang the join. */
async function getIdTokenBounded(): Promise<string> {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('Not signed in');
  const attempt = (forceRefresh: boolean, ms: number): Promise<string> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('ID token request timed out')), ms);
    });
    return Promise.race([fbUser.getIdToken(forceRefresh), timeout]).finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    });
  };
  try {
    return await attempt(false, 10000);
  } catch {
    return await attempt(true, 10000);
  }
}

async function fetchLivekitTokenOnce(
  roomId: string,
  userName: string,
): Promise<LivekitTokenData> {
  const idToken = await getIdTokenBounded();
  const tokenCtrl = new AbortController();
  const tokenTimeout = setTimeout(() => tokenCtrl.abort(), TOKEN_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        roomName: roomId,
        participantName: userName,
        canPublish: true,
      }),
      signal: tokenCtrl.signal,
    });
  } catch (e) {
    throw new Error(
      e instanceof Error && e.name === 'AbortError'
        ? 'Voice server request timed out (20s)'
        : 'Voice server request failed (network)',
    );
  } finally {
    clearTimeout(tokenTimeout);
  }
  if (!res.ok) throw new Error(`Voice server request failed (${res.status})`);
  const data = (await res.json()) as { token?: string; url?: string };
  if (!data.token || !data.url) {
    throw new Error('Voice server returned an invalid response');
  }
  return { token: data.token, url: data.url };
}

/** Fetch a LiveKit token with retries on transient failures. */
export async function fetchLivekitToken(
  roomId: string,
  userName: string,
): Promise<LivekitTokenData> {
  const backoffsMs = [1000, 2500];
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= backoffsMs.length; attempt++) {
    try {
      return await fetchLivekitTokenOnce(roomId, userName);
    } catch (e) {
      lastError = e;
      const message = e instanceof Error ? e.message : '';
      const transient =
        message.includes('timed out') ||
        message.includes('(network)') ||
        /\(5\d\d\)$/.test(message);
      if (!transient || attempt === backoffsMs.length) throw e;
      await new Promise((resolve) => setTimeout(resolve, backoffsMs[attempt]));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Voice server request failed (network)');
}
