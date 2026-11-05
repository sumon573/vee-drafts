# Build log — YoHo clone (replica-build)

Method: replica-build (replica-skill), from `recon.md` + `architecture.md` + `design/`.
Scope: **Full clone** (boss order — nothing left out). This log covers the
**vertical slice only** (architecture build order step 1). Later milestones
append here. Clean-room: every line written fresh from the recon map and
the specs; no YoHo code, assets, logos, trademarks, copy or user data.
Nothing shipped; no production release (release governance stands).

## Vertical slice — 2026-11-05

Screens: S02 (deferred, see below), S03, S04, S05, S07.
Flow: sign up -> discover a room -> join -> take a mic seat -> talk
(LiveKit voice) -> chat -> leave. Proves the stack (Expo + Firebase Auth
+ RTDB + LiveKit + VPS API). Nothing else until this works on a real phone.

| screen | date | status | notes |
| --- | --- | --- | --- |
| S02 Language selection | 2026-11-05 | deferred | App launches in English (the only language for the slice). A language picker for a single-language app is a pointless screen; the picker is a later milestone. features.csv: partial. |
| S03 Sign-in / Login | 2026-11-05 | partial | Email + password works (Firebase Auth). Google is wired (expo-web-browser OAuth, Vee's pattern) but needs the clone's OAuth client ID injected. Facebook / TikTok / SMS are a later auth milestone (own SDKs / app IDs) and are NOT shown as dead buttons. "Can't login?" recovery is later (needs Resend). |
| S04 Profile setup | 2026-11-05 | done | Nickname (required), gender, age (13+ enforced), country, bio. Avatar photo upload is later (needs the media service); initials show for now. |
| S05 Home — room discovery | 2026-11-05 | partial | Hot/Related tabs, room cards (cover + topic tag + listener count), 2-col grid, empty + loading (skeleton) states, pull-to-refresh. Banner is a static promo card (auto-scroll carousel is later). Search, activity rooms, events entry are later. |
| S07 Voice room | 2026-11-05 | partial | Room header (title + numeric ID + online count), host seat 0 + guest seats 1-8, seat claim via RTDB transaction, mic publish only on a seat, mute/unmute (LiveKit + RTDB seat state), realtime chat, leave/end room. Gift button says plainly that gifts are the next milestone. Speaker toggle, emoji, room "..." menu (S08), Record, room diamond value are later. |
| (tabs) shell | 2026-11-05 | done | 5-tab bottom nav (Home, Moments, Create centre +, Messages, Me). Moments / Messages are honest stubs ("comes after the voice loop"); Me shows the user + sign-out. Create opens the minimal create-room form (title, topic, capacity) — the bootstrap for rooms, since the clone starts empty. |
| Primitives | 2026-11-05 | done | Button, TextInput, Badge, Avatar, RoomCard, MicSeat, ChatMessageRow, ChatInputBar — all from components.md, tokens only, no raw hex/pixel values in components. |

## What is NOT yet working / needed for the next step

1. **Staging Firebase apiKey + appId (BLOCKER for live proof).** The real
   values live only in the GitHub secret VEE_TEST_FIREBASE_CONFIG. The app
   has placeholders in `src/config/firebase.ts` (projectId, databaseURL,
   authDomain, storageBucket, messagingSenderId are the staging project's
   public config and are already correct). Until the apiKey + appId are
   injected (same prepare-script mechanism as the Vee test app), the app
   cannot sign in or read RTDB. Evidence: code-only, device test pending.
2. **Google OAuth client ID (BLOCKER for Google sign-in).** The code is
   written (Vee's expo-web-browser pattern); the clone's own Google OAuth
   web client ID + redirect URI must be configured for the staging Firebase
   project and injected into `src/lib/auth.tsx` (GOOGLE_WEB_CLIENT_ID).
3. **Staging RTDB rules — clone namespace.** The slice writes under
   `yoho_clone/*` (rooms, seats, messages, users). The staging RTDB rules
   are Vee's prod-shaped rules; they must allow authenticated writes under
   `yoho_clone/*`. If they deny it, add a `yoho_clone` node to the staging
   rules (same pattern as Vee's rules) via the VPS firebase deploy.
4. **LiveKit token endpoint — verify.** The slice calls the staging API
   `POST {API_BASE}/api/livekit/token` (same endpoint the Vee test app
   uses). It needs a Firebase ID token, so it cannot be tested until (1)
   is resolved. The staging LiveKit (ports 7890-7892, Caddy /test-livekit)
   is up, but the token round-trip is unverified.
5. **Development build (not Expo Go).** @livekit/react-native has native
   code (WebRTC), so the app needs a development build (`eas build
   --profile development` or `npx expo run:android`) to run voice on a
   real phone. Expo Go cannot run it.
6. **Auth providers (next milestone).** Facebook, TikTok, SMS/phone,
   "Can't login?" recovery. They need their own SDKs / app IDs / Resend.
7. **Gift / wallet (next milestone).** The gift panel, catalog, wallet,
   and purchase verification are milestone 2 (must-haves). The gift
   button in the room says so plainly.
8. **Art (dependency, from design AUDIT.md).** Gift / entrance / avatar
   frame / banner art is not commissioned yet. The build cannot be premium
   without it; replica-brand / the art commission must supply it.

## What was harder than expected

- **The staging Firebase config is not stored locally.** The real apiKey +
  appId live only in the GitHub secret VEE_TEST_FIREBASE_CONFIG. Local
  copies (clone-test5) are validation placeholders. The slice is built so
  the config is a single-file injection (src/config/firebase.ts) — the
  same prepare-script mechanism as the Vee test app.
- **Expo SDK drift.** The scaffold installed SDK 58 (expo ~58, RN 0.88,
  TS ~6.0), while Vee ships SDK 54. `npx expo install` resolved
  SDK-58-compatible versions (LiveKit 3.x, firebase 13.x, expo-router
  58.x). The code is written against the SDK-58 APIs; if a LiveKit 3.x
  API differs from Vee's 2.x usage, the typecheck will catch it.
- **The "How To Tuts" walkthrough video is a BlueStacks promo, not a
  YoHo walkthrough.** (Architect's finding.) The flows are therefore
  derived from written guides + screenshots, with confidence noted.
- **No public click-by-click YoHo video exists.** In-app screens that
  could not be verified from public sources are marked inferred in the
  recon; the slice builds them from the recon's component list.

## Evidence (2026-11-05, after lint fixes)

- Typecheck: `npx tsc --noEmit` in `app/` — **PASS (exit 0, no errors)**.
  Fixes applied: Lucide icons use `stroke` (not `color`) — v1.69 `LucideProps`
  extends `SvgProps` and has no `color` prop; `react-native-svg` was a
  missing peer dep (installed via `npx expo install react-native-svg`);
  `ActiveSpeakersChanged` passes `Participant[]` (not `RemoteParticipant[]`).
- Lint: `npx expo lint` — **PASS (exit 0, 0 problems)** after fixing 3 errors
  (refs synced in an effect, not during render; setConnecting/setError moved
  into the async connect callback) + 3 unused-import warnings. eslint +
  eslint-config-expo installed with `--legacy-peer-deps` (peer conflict
  with @radix-ui from expo-router — same as the LiveKit plugin install).
- Expo doctor: `npx expo-doctor` — **20/20 checks passed** after installing
  the missing expo-router peers (expo-constants, expo-linking,
  react-native-safe-area-context).
- Impeccable `detect` on `src/` (25 TSX/TS files) — **0 pattern-rule
  findings**. Rendered-page rules (tiny-text, low-contrast) did not run:
  they need a rendered page, and these are React Native sources (no web
  URL to scan) — per the impeccable skill, that is stated, not faked.
- Bundle: `npx expo export --platform android` — **PASS**. Metro bundled
  `expo-router/entry.js` (3588 modules) into a 7.7MB Android Hermes bundle
  (`entry-*.hbc`), exit 0. Web export was skipped (react-native-web is not
  installed; the clone is a mobile app, not a web app). Re-exported after
  the lint fixes — **PASS again** (7.7MB bundle, exit 0, output
  /tmp/yoho-export-android2).
- Device test: PENDING. The vertical slice counts as done only when it
  runs on a real phone (sign up -> join -> seat -> talk -> chat -> leave).
  No device claim is made here.
