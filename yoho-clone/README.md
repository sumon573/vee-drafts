# YoHo Clone

A clean-room clone of the YoHo group voice-chat app, built with the
replica-skill workflow (recon → architect → design → build → backend →
test → diff → entrepreneur → brand → launch → deploy).

**Clean-room:** every line is written fresh from the recon map and the
specs. No YoHo code, assets, logos, trademarks, copy, or user data.
Functionality and UX patterns only, rebuilt with the clone's own brand,
art, and assets.

## Stack

- Expo (React Native) + TypeScript app (SDK 58)
- Firebase Auth + RTDB (staging project `vee-test-staging` — shared test
  backend, never production)
- LiveKit self-hosted (staging instance, via the staging API token endpoint)
- Postgres on the VPS (money truth, later milestones)
- Node + TypeScript API on the Contabo VPS behind Caddy

See `docs/architecture.md` for the full stack, schema, and API design,
`docs/recon.md` for the recon map, and `docs/build-log.md` for the
build log.

## Status

Vertical slice (milestone 1): sign up → discover → join → take a mic
seat → talk (LiveKit voice) → chat → leave. The slice counts as done
only when it runs on a real phone.

## Build (development APK)

The app is staging-only by design. The staging Firebase `apiKey` + `appId`
live only in the GitHub secret `VEE_TEST_FIREBASE_CONFIG` (same secret the
Vee test app uses) and are injected at build time by
`tools/prepare-clone.cjs` — they never touch the repo.

```bash
# Local validation (dummy secret, correct shape):
CLONE_DIR=. VEE_TEST_FIREBASE_CONFIG='{"apiKey":"AIzaSy...","appId":"1:657798429620:web:...","projectId":"vee-test-staging"}' node tools/prepare-clone.cjs
npm ci
npx tsc --noEmit
```

The real dev APK is built by GitHub Actions
(`.github/workflows/yoho-clone-apk.yml` in the vee-drafts repo, manual
dispatch only). A development build is a TEST artifact, not a release.

## Layout

- `src/app/` — Expo Router screens (tabs, sign-in, profile-setup, room)
- `src/components/` — primitives (Button, TextInput, Badge, Avatar,
  RoomCard, MicSeat, ChatMessageRow, ChatInputBar)
- `src/config/` — Firebase + API config (staging only)
- `src/lib/` — auth, rooms (RTDB), voice (LiveKit)
- `src/theme/` — design tokens
- `tools/` — `prepare-clone.cjs` (CI injection + eas.json + icon decode)
  and `icons.base64.json` (the icon PNGs as base64 text — the PNGs are
  binary, so they travel as text in the repo and are decoded by prepare)
- `docs/` — recon, architecture, design, build log
