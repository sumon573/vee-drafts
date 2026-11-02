# Vee SVIP — Safe Test APK & OTA Setup

**Status: PREPARED, NOT BUILT, NOT DEPLOYED.** This repository contains a manual-only CI harness for a disposable **SVIP UI-only** Android test app. It is **not** the full Vee app and does **not** connect to live Firebase or run voice rooms, wallet, authentication, or purchases. Never represent this preview as complete end-to-end testing.

## Protected original
- Frozen source: `sumon573/Updated-vee-code` commit `46fe4e3974a1d02fe806da1ed55c2ee8ef2093a5`, branch `base-working-version`.
- The original GitHub repository and every shipping/working branch remain read-only. This setup never commits, pushes, or publishes anything to them.
- Draft-only repository: `sumon573/vee-drafts` branch `main`.

## What is prepared
1. `tools/prepare-svip-sandbox.cjs`: verifies original SHA, **requires a separate EAS project**, strips production app routes in a disposable CI checkout, builds only an SVIP UI preview, disables live actions, and creates a uniquely named Android app `com.vee.app.sviptest`.
2. `.github/workflows/svip-sandbox-apk.yml`: manual `workflow_dispatch` only, requires exact `BUILD_SVIP_SANDBOX` confirmation; builds test APK with EAS, never publishes updates.
3. `.github/workflows/svip-sandbox-ota.yml`: manual `workflow_dispatch` only, requires exact `UPDATE_SVIP_SANDBOX` confirmation; OTA publishes only to `vee-svip-sandbox`, never to preview or production.
4. Runtime pinned to `vee-svip-sandbox-v1`. Custom package, scheme, channel, EAS project ID, update URL. Existing `expo-updates` package already present in source; no new app dependency is introduced.

## Required setup — do not paste secrets in chat
In **vee-drafts → Settings → Secrets and variables → Actions**, add:
- `EXPO_TOKEN` — Expo token with permission to access a **new separate** sandbox Expo/EAS project.
- `VEE_SOURCE_READ_TOKEN` — fine-grained GitHub token with **read-only Contents** permission for `sumon573/Updated-vee-code`.
- `VEE_SANDBOX_EAS_PROJECT_ID` — UUID of that independent sandbox Expo project; the harness **rejects** live project ID `76af2941-e66e-4252-afd1-bed9f3745348`. A project name alone is not a substitute.

Do not set up credentials until you have created a separate Expo sandbox project. Never expose Expo or GitHub tokens in source code or chat. GitHub Actions logs and Expo build configuration should be reviewed before the first run.

## Manual build
1. Open the [SVIP sandbox APK workflow](https://github.com/sumon573/vee-drafts/actions/workflows/svip-sandbox-apk.yml) on branch `main`.
2. Click **Run workflow**, type `BUILD_SVIP_SANDBOX`, launch.
3. The workflow must first check the pinned source, separate project ID, package ID, blocked permissions, UI routes and TypeScript. **Only then** can EAS generate the test APK.
4. Read EAS build logs; download APK from the successful EAS build. Test app is installed separately alongside Vee.
5. The original production Vee app is not affected by this CI process.

## Manual test OTA
**Only after** a successful sandbox APK build is installed and its channel verified:
1. Open [SVIP sandbox OTA workflow](https://github.com/sumon573/vee-drafts/actions/workflows/svip-sandbox-ota.yml).
2. Type `UPDATE_SVIP_SANDBOX` and a small description.
3. The script rebuilds a disposable sandbox checkout, checks the project ID/package/runtime/channel, and invokes only:
   `eas update --channel vee-svip-sandbox --non-interactive`
4. Confirm new UI update on the **test app**. No production update occurs.
5. The OTA workflow is intentionally manual; there are **no push triggers**.

## Artwork and runtime limitations
- Ten approved SVIP static WebP files currently live in the separately delivered `Vee_SVIP_Muse_Design_Handoff_2026-11-02.zip`. **They have not yet been committed as binaries to vee-drafts.**
- Until all ten files exist under `design/svip/assets/badges/` and `design/svip/assets/frames/` in the draft repository, the sandbox falls back to existing **public read-only emblem URLs**, with a visible art-pending banner.
- For integration, do not claim the art is uploaded, that entry-effect motion is approved, or that the phone build has been tested.
- This first sandbox intentionally does not include Firebase or authentication. It cannot test paid SVIP behavior, membership state, production routing, live data, voice calls, wallet, or purchases.
- The **live Vee app** is untouched. When user approves full-app testing, create a separate staging backend before enabling any production-service connection.
- Android APK build and EAS project setup may require external account configuration, permissions, quota, and a user action. No build was triggered by creating these files.

## Safety checklist
- [ ] No changes to `Updated-vee-code` or `working-2026-10-13-clean`
- [ ] Independent Expo sandbox project confirmed
- [ ] Exact SHA checkout `46fe4e39` confirmed
- [ ] Unique Android package `com.vee.app.sviptest`
- [ ] Sandbox EAS channel/runtime `vee-svip-sandbox`/`vee-svip-sandbox-v1`
- [ ] Only SVIP UI routes, no Firebase/auth/wallet imports
- [ ] Only approved static assets, no unapproved dragon animation
- [ ] Manual build/OTA only, no production publish
- [ ] Actual EAS build success and Android smoke test before calling ready

## Next steps
1. Create a **separate** Expo sandbox project (not the live Vee project).
2. Configure the three GitHub Actions secrets privately.
3. Upload all ten approved WebP binaries to `vee-drafts` after validating their alpha/background and captions, or proceed with the clearly labeled public-legacy-art sandbox preview.
4. Manually run the APK workflow, verify logs, install and test on Android.
5. Only after testing should further draft integrations be developed and released under a new explicit approval.
