// prepare-clone.cjs — YoHo clone development-build preparation.
// Runs in CI (GitHub Actions, vee-drafts workflow) on a checkout of the
// yoho-clone repo. The clone is STAGING-ONLY by design: it already points
// at the staging Firebase project (vee-test-staging) and the staging API
// (https://vee-club.duckdns.org/test-api). This script only:
//   1. Injects the real staging apiKey + appId from VEE_TEST_FIREBASE_CONFIG
//      (GitHub secret, same secret the Vee test app uses) into
//      src/config/firebase.ts, replacing the placeholders. Fails closed if
//      the secret is missing, invalid, or not the staging project.
//   2. Writes eas.json with ONLY the development profile (dev build, APK,
//      internal distribution). No production profile can exist.
//   3. Decodes the icon PNGs from tools/icons.base64.json into assets/
//      (the PNGs are binary, so they travel as base64 text in the repo).
//   4. If YOHO_CLONE_EAS_PROJECT_ID is set, writes it into app.json
//      (extra.eas.projectId + updates.url). If unset, app.json is left
//      without a projectId and the workflow runs `eas project init`.
//   5. Leak guard: the tree must contain NO production Firebase project,
//      NO production Expo project ID, NO production API base.
// NEVER run against production; never inject a non-staging config.
//
// Env: CLONE_DIR (default: repo root = parent of this script's dir),
//   VEE_TEST_FIREBASE_CONFIG (required JSON),
//   YOHO_CLONE_EAS_PROJECT_ID (optional).
const fs = require('fs');
const path = require('path');

function fail(msg) { console.error('PREPARE_CLONE_FAIL: ' + msg); process.exit(1); }
function log(msg) { console.log('PREPARE_CLONE: ' + msg); }
function replaceOnce(text, pattern, replacement, label) {
  const parts = text.split(pattern);
  if (parts.length !== 2) fail(label + ': anchor found ' + (parts.length - 1) + ' times (expected 1)');
  return parts.join(replacement);
}

const CLONE_DIR = process.env.CLONE_DIR || path.join(__dirname, '..');
const firebasePath = path.join(CLONE_DIR, 'src', 'config', 'firebase.ts');
const apiPath = path.join(CLONE_DIR, 'src', 'config', 'api.ts');
const appJsonPath = path.join(CLONE_DIR, 'app.json');
const easJsonPath = path.join(CLONE_DIR, 'eas.json');
const iconsJsonPath = path.join(CLONE_DIR, 'tools', 'icons.base64.json');

if (!fs.existsSync(firebasePath)) fail('src/config/firebase.ts missing at ' + firebasePath);
if (!fs.existsSync(apiPath)) fail('src/config/api.ts missing');
if (!fs.existsSync(appJsonPath)) fail('app.json missing');

// ---- 1. Firebase config from the workflow secret (staging ONLY) ----
if (!process.env.VEE_TEST_FIREBASE_CONFIG) {
  fail('VEE_TEST_FIREBASE_CONFIG is not set (GitHub secret required)');
}
let fb;
try { fb = JSON.parse(process.env.VEE_TEST_FIREBASE_CONFIG); }
catch (e) { fail('VEE_TEST_FIREBASE_CONFIG is not valid JSON'); }
if (fb.projectId !== 'vee-test-staging') {
  fail('VEE_TEST_FIREBASE_CONFIG projectId is not vee-test-staging: ' + fb.projectId);
}
if (typeof fb.apiKey !== 'string' || !fb.apiKey.startsWith('AIzaSy')) {
  fail('VEE_TEST_FIREBASE_CONFIG apiKey does not look like a Firebase web apiKey');
}
if (typeof fb.appId !== 'string' || !/^1:657798429620:web:[A-Za-z0-9_-]+$/.test(fb.appId)) {
  fail('VEE_TEST_FIREBASE_CONFIG appId is not the staging web appId');
}
let firebaseSrc = fs.readFileSync(firebasePath, 'utf8');
firebaseSrc = replaceOnce(firebaseSrc, "apiKey: 'STAGING-API-KEY-NOT-CONFIGURED'", "apiKey: '" + fb.apiKey + "'", 'firebase apiKey');
firebaseSrc = replaceOnce(firebaseSrc, "appId: '1:657798429620:web:staging-not-configured'", "appId: '" + fb.appId + "'", 'firebase appId');
fs.writeFileSync(firebasePath, firebaseSrc);
log('firebase.ts -> staging config injected (projectId vee-test-staging, apiKey + appId from secret)');

// ---- 2. eas.json: ONLY the development profile ----
const easJson = {
  cli: { version: '>= 16.0.0', appVersionSource: 'local' },
  build: {
    development: {
      developmentClient: true,
      distribution: 'internal',
      channel: 'yoho-clone-dev',
      android: { buildType: 'apk', image: 'ubuntu-24.04-jdk-17-ndk-r27b' },
      env: { EXPO_PUBLIC_API_BASE_URL: 'https://vee-club.duckdns.org/test-api' },
    },
  },
  submit: {},
};
fs.writeFileSync(easJsonPath, JSON.stringify(easJson, null, 2) + '\n');
log('eas.json -> ONLY development profile, channel yoho-clone-dev');

// ---- 3. Decode icon PNGs from base64 (binary travels as text in the repo) ----
if (!fs.existsSync(iconsJsonPath)) fail('tools/icons.base64.json missing');
let icons;
try { icons = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf8')); }
catch (e) { fail('tools/icons.base64.json is not valid JSON'); }
const needIcons = ['icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png'];
for (const name of needIcons) {
  const b64 = icons[name];
  if (typeof b64 !== 'string' || b64.length < 100) fail('icons.base64.json missing/short entry: ' + name);
  const buf = Buffer.from(b64, 'base64');
  // PNG magic bytes — refuse to write anything that is not a PNG.
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    fail('icons.base64.json entry is not a PNG: ' + name);
  }
  fs.writeFileSync(path.join(CLONE_DIR, 'assets', name), buf);
  log('icon decoded: assets/' + name + ' (' + buf.length + ' B)');
}

// ---- 4. Expo project ID (if already known) ----
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const ex = appJson.expo || {};
if (ex.slug !== 'yoho-clone') fail('unexpected slug: ' + ex.slug);
if (ex.android?.package !== 'com.yohoclone.app') fail('unexpected package: ' + ex.android?.package);
if (ex.scheme !== 'yoho') fail('unexpected scheme: ' + ex.scheme);
const projectId = process.env.YOHO_CLONE_EAS_PROJECT_ID || '';
if (projectId) {
  ex.extra = ex.extra || {};
  ex.extra.eas = ex.extra.eas || {};
  ex.extra.eas.projectId = projectId;
  ex.updates = ex.updates || {};
  ex.updates.url = 'https://u.expo.dev/' + projectId;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  log('app.json -> projectId ' + projectId);
} else {
  log('app.json -> no projectId yet (workflow will run eas project init)');
}

// ---- 5. LEAK GUARD: no production reference may exist in the tree ----
const treeText = (p) => fs.readFileSync(p, 'utf8');
const checks = [
  ['firebase no prod project', !treeText(firebasePath).includes("projectId: 'vee-chat-36720'")],
  ['firebase staging project', treeText(firebasePath).includes("projectId: 'vee-test-staging'")],
  ['firebase apiKey injected', !treeText(firebasePath).includes("apiKey: 'STAGING-API-KEY-NOT-CONFIGURED'")],
  ['firebase appId injected', !treeText(firebasePath).includes("appId: '1:657798429620:web:staging-not-configured'")],
  ['api staging base', treeText(apiPath).includes('https://vee-club.duckdns.org/test-api')],
  ['api no prod base', !treeText(apiPath).replace('https://vee-club.duckdns.org/test-api', '').includes('vee-club.duckdns.org/api')],
  ['app.json no prod expo id', !treeText(appJsonPath).includes('76af2941')],
  ['app.json no prod project', !treeText(appJsonPath).includes('vee-chat-36720')],
  ['eas profiles only development', JSON.stringify(Object.keys(JSON.parse(treeText(easJsonPath)).build)) === JSON.stringify(['development'])],
  ['eas no prod expo id', !treeText(easJsonPath).includes('76af2941')],
];
for (const [label, ok] of checks) {
  if (!ok) fail('LEAK GUARD FAILED: ' + label);
  log('guard ok: ' + label);
}
console.log('PREPARE_CLONE_ALL_PASS');
