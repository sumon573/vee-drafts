// prepare-full-test-app.cjs — Full Vee Test App build preparation (2026-11-03).
// Runs in a DISPOSABLE checkout. NEVER run against the shipping branch itself:
// the workflow clones sumon573/Updated-vee-code read-only, runs this script
// on the clone, and builds from the sanitized clone only.
//
// What it does (and does NOT do):
// - PRESERVES the complete app: all routes, services, native plugins and
//   permissions stay exactly as production. Unlike the old SVIP-only
//   prepare-svip-sandbox.cjs, NOTHING is stripped except production identity
//   and production backend connections.
// - Swaps identity: name Vee Test, package com.vee.app.sviptest, Expo project
//   = sandbox project (never production 76af2941...), updates URL = sandbox
//   project, channel vee-test, runtime string vee-test-v1 (never 1.0.0).
//   Slug MUST stay vee-svip-sandbox: EAS validates app.json slug against the
//   sandbox project's slug (proven by the sandbox slug-fix run).
// - Severs production backends (fail closed, never silently live):
//   Firebase config -> staging placeholders (or VEE_TEST_FIREBASE_CONFIG JSON
//   when the workflow secret is set); API base fallback -> dead staging URL;
//   media upload base -> dead staging URL; OneSignal app id -> empty
//   (its init is .catch-guarded and non-critical, so boot is unaffected).
// - Deletes production google-services.json and strips its app.json key.
// - Keeps scheme 'vee' (v1): changing it would break the Google OAuth
//   redirect wiring (googleAuthService 'vee://oauth') and invite links.
//   Side-by-side quirk (documented): vee:// links may offer both apps.
// - Static public art constants (noble/intimacy art hosts) are intentionally
//   LEFT: they are read-only public art, not user data/auth/money. This is a
//   documented difference until staging media exists.
// - Leak guard: every assertion below must pass or the build FAILS. No
//   staging URL, staging key, mock flag or test-only flag may ever reach
//   production because this script only ever runs on the disposable clone
//   and the production workflow never uses it.
//
// Env: SOURCE_DIR (repo root containing artifacts/vee), DRAFT_DIR (optional,
//   vee-drafts checkout for full-test-overlay/), VEE_TEST_PROJECT_ID (required),
//   VEE_TEST_API_BASE (default https://vee-test.invalid),
//   VEE_TEST_FIREBASE_CONFIG (optional JSON), EXPECTED_SHA (optional).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fail(msg) { console.error('PREPARE_FAIL: ' + msg); process.exit(1); }
function log(msg) { console.log('PREPARE: ' + msg); }
function replaceOnce(text, pattern, replacement, label) {
  const parts = text.split(pattern);
  if (parts.length !== 2) fail(label + ': anchor found ' + (parts.length - 1) + ' times (expected 1)');
  return parts.join(replacement);
}
function replaceRegexOnce(text, regex, replacement, label) {
  const m = text.match(regex);
  if (!m || m.length !== 1) {
    const count = (text.match(new RegExp(regex.source, 'g')) || []).length;
    fail(label + ': regex matched ' + count + ' times (expected 1)');
  }
  return text.replace(regex, replacement);
}

const SOURCE_DIR = process.env.SOURCE_DIR || fail('SOURCE_DIR required');
const DRAFT_DIR = process.env.DRAFT_DIR || '';
const PROJECT_ID = process.env.VEE_TEST_PROJECT_ID || fail('VEE_TEST_PROJECT_ID required');
const API_BASE = process.env.VEE_TEST_API_BASE || 'https://vee-test.invalid';
const APP_DIR = path.join(SOURCE_DIR, 'artifacts', 'vee');
const appJsonPath = path.join(APP_DIR, 'app.json');
const easJsonPath = path.join(APP_DIR, 'eas.json');
const firebasePath = path.join(APP_DIR, 'src', 'config', 'firebase.ts');
const platformPath = path.join(APP_DIR, 'src', 'utils', 'platform.ts');
const cloudinaryPath = path.join(APP_DIR, 'src', 'services', 'cloudinaryService.ts');
const onesignalPath = path.join(APP_DIR, 'src', 'config', 'onesignal.ts');
const gsPath = path.join(APP_DIR, 'google-services.json');

if (!fs.existsSync(appJsonPath)) fail('app.json missing at ' + appJsonPath);
if (!fs.existsSync(firebasePath)) fail('firebase.ts missing');
if (!fs.existsSync(platformPath)) fail('platform.ts missing');

// Source HEAD (for the auditable build log).
let head = '';
try { head = execSync('git -C "' + SOURCE_DIR + '" rev-parse HEAD', { encoding: 'utf8' }).trim(); } catch (e) { log('git HEAD unavailable (non-git checkout)'); }
if (process.env.EXPECTED_SHA && head && head !== process.env.EXPECTED_SHA) {
  fail('source HEAD ' + head + ' != EXPECTED_SHA ' + process.env.EXPECTED_SHA);
}
log('source HEAD: ' + (head || '(unknown)'));

// ---- Assert ORIGINAL production identity (fail loudly on source drift) ----
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const ex = appJson.expo || {};
if (ex.android?.package !== 'com.vee.app') fail('unexpected original package: ' + ex.android?.package);
if (ex.extra?.eas?.projectId !== '76af2941-e66e-4252-afd1-bed9f3745348') fail('unexpected original projectId');
if (ex.slug !== 'hridoy5') fail('unexpected original slug: ' + ex.slug);
if (!ex.runtimeVersion || ex.runtimeVersion.policy !== 'appVersion') fail('unexpected original runtimeVersion');
if (!fs.existsSync(gsPath)) fail('expected production google-services.json present before stripping');
const firebaseSrc0 = fs.readFileSync(firebasePath, 'utf8');
if (!firebaseSrc0.includes('vee-chat-36720')) fail('firebase.ts lacks production project marker (drift?)');
const platformSrc0 = fs.readFileSync(platformPath, 'utf8');
if (!platformSrc0.includes('https://vee-club.duckdns.org')) fail('platform.ts lacks duckdns fallback (drift?)');

// ---- app.json: test identity ----
ex.name = 'Vee Test';
ex.slug = 'vee-svip-sandbox'; // MUST match the sandbox Expo project's slug.
ex.android.package = 'com.vee.app.sviptest';
if (ex.ios) ex.ios.bundleIdentifier = 'com.vee.app.sviptest';
ex.extra.eas.projectId = PROJECT_ID;
ex.updates = ex.updates || {};
ex.updates.url = 'https://u.expo.dev/' + PROJECT_ID;
ex.runtimeVersion = 'vee-test-v1'; // string runtime: never 1.0.0, never production.
delete ex.android.googleServicesFile;
if (ex.ios) delete ex.ios.googleServicesFile;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
log('app.json -> Vee Test / com.vee.app.sviptest / ' + PROJECT_ID + ' / vee-test-v1');

// ---- eas.json: ONLY the vee-test profile (no production profile can exist) ----
const easJson = {
  cli: { version: '>= 16.0.0', appVersionSource: 'local' },
  build: {
    'vee-test': {
      channel: 'vee-test',
      distribution: 'internal',
      android: { buildType: 'apk', image: 'ubuntu-24.04-jdk-17-ndk-r27b' },
      env: { EXPO_PUBLIC_API_BASE_URL: API_BASE, VEE_TEST_MODE: '1' },
    },
  },
  submit: {},
};
fs.writeFileSync(easJsonPath, JSON.stringify(easJson, null, 2) + '\n');
log('eas.json -> ONLY vee-test profile, channel vee-test');

// ---- Delete production google-services.json ----
fs.unlinkSync(gsPath);
log('google-services.json deleted (production Firebase config must never ship)');

// ---- firebase.ts: staging config (placeholders, or workflow-secret values) ----
let fb = {
  apiKey: 'STAGING-NOT-CONFIGURED',
  authDomain: 'vee-test-staging.firebaseapp.com',
  databaseURL: 'https://vee-test-staging-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'vee-test-staging',
  storageBucket: 'vee-test-staging.firebasestorage.app',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:stagingnotconfigured',
};
if (process.env.VEE_TEST_FIREBASE_CONFIG) {
  try { fb = { ...fb, ...JSON.parse(process.env.VEE_TEST_FIREBASE_CONFIG) }; }
  catch (e) { fail('VEE_TEST_FIREBASE_CONFIG is not valid JSON'); }
  log('firebase.ts using workflow-secret staging config');
} else {
  log('firebase.ts using staging PLACEHOLDERS (login/data BLOCKED until staging Firebase is wired)');
}
let firebaseSrc = firebaseSrc0;
firebaseSrc = replaceOnce(firebaseSrc, 'Production Setup', 'TEST / STAGING - never production', 'firebase header');
firebaseSrc = replaceOnce(firebaseSrc, 'Vee App — vee-chat-36720', 'Vee App — vee-test-staging (TEST ONLY)', 'firebase header project');
firebaseSrc = replaceRegexOnce(firebaseSrc, /apiKey:\s*'[^']*'/, "apiKey: '" + fb.apiKey + "'", 'firebase apiKey');
firebaseSrc = replaceRegexOnce(firebaseSrc, /authDomain:\s*'[^']*'/, "authDomain: '" + fb.authDomain + "'", 'firebase authDomain');
firebaseSrc = replaceRegexOnce(firebaseSrc, /databaseURL:\s*'[^']*'/, "databaseURL: '" + fb.databaseURL + "'", 'firebase databaseURL');
firebaseSrc = replaceRegexOnce(firebaseSrc, /projectId:\s*'[^']*'/, "projectId: '" + fb.projectId + "'", 'firebase projectId');
firebaseSrc = replaceRegexOnce(firebaseSrc, /storageBucket:\s*'[^']*'/, "storageBucket: '" + fb.storageBucket + "'", 'firebase storageBucket');
firebaseSrc = replaceRegexOnce(firebaseSrc, /messagingSenderId:\s*'[^']*'/, "messagingSenderId: '" + fb.messagingSenderId + "'", 'firebase messagingSenderId');
firebaseSrc = replaceRegexOnce(firebaseSrc, /appId:\s*'[^']*'/, "appId: '" + fb.appId + "'", 'firebase appId');
fs.writeFileSync(firebasePath, firebaseSrc);
log('firebase.ts -> staging config (projectId ' + fb.projectId + ')');

// ---- platform.ts: API fallback must NEVER be production ----
let platformSrc = platformSrc0;
platformSrc = replaceOnce(platformSrc, 'https://vee-club.duckdns.org', API_BASE, 'platform fallback');
fs.writeFileSync(platformPath, platformSrc);
log('platform.ts fallback -> ' + API_BASE);

// ---- cloudinaryService.ts: media uploads must NEVER hit production ----
if (fs.existsSync(cloudinaryPath)) {
  let cs = fs.readFileSync(cloudinaryPath, 'utf8');
  const n = cs.split('https://vee-club.duckdns.org').length - 1;
  if (n < 1) fail('cloudinary MEDIA_BASE: anchor not found');
  cs = cs.split('https://vee-club.duckdns.org').join(API_BASE);
  fs.writeFileSync(cloudinaryPath, cs);
  log('cloudinary MEDIA_BASE -> ' + API_BASE + ' (uploads fail closed, ' + n + ' refs)');
}

// ---- onesignal.ts: neutralize production push audience ----
if (fs.existsSync(onesignalPath)) {
  let os = fs.readFileSync(onesignalPath, 'utf8');
  os = replaceRegexOnce(os, /ONESIGNAL_APP_ID\s*=\s*'[^']*'/, "ONESIGNAL_APP_ID = ''", 'onesignal app id');
  os = os.split('7bcaa8e5-f51a-4b57-ab3a-7600ea06709c').join('REMOVED'); // scrub comment copy too
  fs.writeFileSync(onesignalPath, os);
  log('onesignal app id neutralized (init is catch-guarded, boot unaffected)');
}

// ---- Draft overlays (future ChatGPT designs): design files only, never config ----
const overlayDir = DRAFT_DIR ? path.join(DRAFT_DIR, 'full-test-overlay') : '';
if (overlayDir && fs.existsSync(overlayDir)) {
  const FORBIDDEN = new Set(['app.json', 'eas.json', 'google-services.json']);
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) walk(p, r);
      else {
        if (FORBIDDEN.has(ent.name)) fail('overlay forbids config file: ' + r);
        const dest = path.join(APP_DIR, r);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(p, dest);
        log('overlay applied: ' + r);
      }
    }
  };
  walk(overlayDir, '');
} else {
  log('no draft overlay (full-test-overlay/ absent) — pure shipping tree + test config');
}

// ---- pnpm hoist for local config plugins (2026-11-03, CI-proven) ----
// The app's local ./plugins/*.js config plugins require('@expo/config-plugins'),
// which is NOT a direct dependency, so pnpm's strict isolation leaves it out
// of the app root's node_modules and EAS prebuild fails with "Unable to
// resolve a valid config plugin" for every local plugin (run #1, 2026-11-03).
// Production (expo.dev, flat npm layout) never hit this because the package
// is hoisted there. Hoisting ONLY this one package in the TEST tree
// reproduces production's layout without adding a dependency or changing
// versions. The .npmrc must exist BEFORE `pnpm install` runs (pnpm will not
// re-link on a no-op install).
fs.writeFileSync(path.join(APP_DIR, '.npmrc'), 'public-hoist-pattern[]=@expo/config-plugins\n');
log('.npmrc -> hoist @expo/config-plugins (local config plugins load under pnpm)');

// ---- Test tsconfig gate file (workflow runs tsc against it) ----
fs.writeFileSync(path.join(APP_DIR, 'tsconfig.test.json'),
  JSON.stringify({ extends: './tsconfig.json', compilerOptions: { types: [] } }, null, 2) + '\n');

// ---- LEAK GUARD: verify the sanitized tree (fail the build on any violation) ----
const appJson2 = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const ex2 = appJson2.expo || {};
const checks = [
  ['package', ex2.android?.package === 'com.vee.app.sviptest'],
  ['projectId', ex2.extra?.eas?.projectId === PROJECT_ID],
  ['updates.url', ex2.updates?.url === 'https://u.expo.dev/' + PROJECT_ID],
  ['runtimeVersion', ex2.runtimeVersion === 'vee-test-v1'],
  ['slug', ex2.slug === 'vee-svip-sandbox'],
  ['name', ex2.name === 'Vee Test'],
  ['no googleServicesFile', !ex2.android?.googleServicesFile],
  ['google-services.json absent', !fs.existsSync(gsPath)],
  ['firebase no prod project', !fs.readFileSync(firebasePath, 'utf8').includes('vee-chat-36720')],
  ['firebase no prod expo id', !fs.readFileSync(firebasePath, 'utf8').includes('76af2941')],
  ['app.json no prod expo id', !fs.readFileSync(appJsonPath, 'utf8').includes('76af2941')],
  ['eas.json no prod expo id', !fs.readFileSync(easJsonPath, 'utf8').includes('76af2941')],
  ['eas profiles only vee-test', JSON.stringify(Object.keys(JSON.parse(fs.readFileSync(easJsonPath, 'utf8')).build)) === JSON.stringify(['vee-test'])],
  ['platform no duckdns', !fs.readFileSync(platformPath, 'utf8').includes('vee-club.duckdns.org')],
];
for (const [label, ok] of checks) {
  if (!ok) fail('LEAK GUARD FAILED: ' + label);
  log('guard ok: ' + label);
}
console.log('PREPARE_ALL_PASS head=' + (head || 'unknown'));
