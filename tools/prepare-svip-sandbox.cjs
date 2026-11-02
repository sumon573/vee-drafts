#!/usr/bin/env node
'use strict';

/**
 * Builds a disposable visual-only SVIP sandbox FROM the immutable source tree.
 * Never writes to Vee's original repository, Firebase, API, or production EAS.
 *
 * Run with: node tools/prepare-svip-sandbox.cjs [path/to/pinned-source-checkout]
 *
 * Output is created ONLY in a temporary GitHub Actions workspace.
 * The original app's routes are removed inside that disposable workspace,
 * preventing the app from importing AuthContext, Firebase and wallet logic.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const draft = path.resolve(__dirname, '..');
const source = path.resolve(process.argv[2] || path.join(draft, 'source'));
const appRoot = path.join(source, 'artifacts', 'vee');
const immutableBase = '46fe4e3974a1d02fe806da1ed55c2ee8ef2093a5';
const sandboxChannel = 'vee-svip-sandbox';
const sandboxRuntime = 'vee-svip-sandbox-v1';
const sandboxPackage = 'com.vee.app.sviptest';
const sandboxProjectId = process.env.VEE_SANDBOX_EAS_PROJECT_ID || '';
const sandboxOwner = process.env.VEE_SANDBOX_EXPO_OWNER || '';

const baseEmblemUrls = {
  1: 'https://vee-club.duckdns.org/m/8548210f9c98881c7f0d3b7637510985',
  2: 'https://vee-club.duckdns.org/m/26685caf5e67ec37594177371ebb0a2b',
  3: 'https://vee-club.duckdns.org/m/948ced7d08f92b678737c698b14b0d82',
  4: 'https://vee-club.duckdns.org/m/82ad4cf07bed1854197f1aafff96037e',
  5: 'https://vee-club.duckdns.org/m/d90334ef6342798b9dd0c53e25f803ad',
};
function assert(test, message) {
  if (!test) throw new Error('SAFE-SANDBOX PRECHECK FAILED: ' + message);
}
assert(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(sandboxProjectId), 'Separate sandbox EAS project id secret required.');
assert(sandboxProjectId !== '76af2941-e66e-4252-afd1-bed9f3745348','Sandbox project must differ from LIVE EAS project.');
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function write(p, text) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
function copyFile(from, to) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); }
function has(p) { return fs.existsSync(p); }

assert(source !== draft, 'Cannot prepare sandbox in draft repository');
assert(has(path.join(source, '.git')), 'Pinned checkout missing. Never run on a live working tree.');
const sourceCommit = cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd: source, encoding: 'utf8'}).trim();
assert(sourceCommit === immutableBase, 'Original checkout must be the frozen base SHA, got '+sourceCommit);
assert(has(path.join(appRoot,'app.json')) && has(path.join(appRoot,'app/svip.tsx')), 'Original Expo app not present.');
const cfgPath = path.join(appRoot, 'app.json');
const cfg = readJson(cfgPath);
assert(cfg.expo?.android?.package === 'com.vee.app', 'Unexpected original Android package.');
assert(cfg.expo?.extra?.eas?.projectId === '76af2941-e66e-4252-afd1-bed9f3745348', 'Unexpected linked Expo project.');
assert(cfg.expo?.updates?.url === 'https://u.expo.dev/76af2941-e66e-4252-afd1-bed9f3745348', 'Unexpected updates URL. Stop to inspect.');

const routeDir = path.join(appRoot, 'app');
fs.rmSync(routeDir, {recursive:true, force:true});
fs.mkdirSync(routeDir, {recursive:true});

// Only React, React Native, Expo Image and the isolated draft SVIP code are
// reachable from these routes. No Firebase/auth/money/room code can execute.
write(path.join(routeDir, '_layout.tsx'), "import React from 'react';\nimport { Slot } from 'expo-router';\nexport default function RootLayout() { return <Slot />; }\n");
const uiSource = path.join(draft, 'src/features/svip/VeeRoyalSvipScreen.tsx');
const configSource = path.join(draft, 'src/features/svip/svipRoyalDesignConfig.ts');
assert(has(uiSource) && has(configSource), 'Draft UI source/config missing.');
copyFile(uiSource, path.join(appRoot, 'src/features/svip/VeeRoyalSvipScreen.tsx'));
copyFile(configSource, path.join(appRoot, 'src/features/svip/svipRoyalDesignConfig.ts'));

// Optional locally-approved art: all ten official WebP files must be uploaded
// to vee-drafts in design/svip/assets/ for sandbox inclusion. No partially
// missing tiers, no silent substitution of random art.
const artBase = path.join(draft, 'design/svip/assets');
const requiredArt = [];
for (const group of ['badges', 'frames']) {
  for (let n = 1; n <= 5; n++) requiredArt.push(path.join(artBase, group, 'svip-' + (group === 'badges' ? 'badge-' : 'frame-') + n + '.webp'));
}
const present = requiredArt.filter(has);
assert(present.length === 0 || present.length === 10,
 'Only '+present.length+'/10 approved assets found. Upload all 10 or remove incomplete set.');
const approvedArtLoaded = present.length === 10;
if (approvedArtLoaded) {
 for (const file of requiredArt) {
  const group = path.basename(path.dirname(file));
  copyFile(file, path.join(appRoot, 'assets/svip',group,path.basename(file)));
 }
}
// Static requires allow Expo Metro to bundle offline images without extra dependencies.
const mappedFrame = approvedArtLoaded
 ? "{"+[1,2,3,4,5].map(i=>i+": require('../assets/svip/frames/svip-frame-"+i+".webp')").join(', ')+"}"
 : '{}';
const mappedBadge = approvedArtLoaded
 ? "{"+[1,2,3,4,5].map(i=>i+": require('../assets/svip/badges/svip-badge-"+i+".webp')").join(', ')+"}"
 : '{}';

const index = [
 "import React from 'react';",
 "import { View, Text } from 'react-native';",
 "import VeeRoyalSvipScreen from '../src/features/svip/VeeRoyalSvipScreen';",
 "import { SVIP_TIERS_FALLBACK, SVIP_PRIVILEGES_FALLBACK } from '../src/features/svip/svipRoyalDesignConfig';",
 "const liveEmblems = "+JSON.stringify(baseEmblemUrls)+";",
 "const frames = "+mappedFrame+";",
 "const badges = "+mappedBadge+";",
 "const artworkLoaded = "+String(approvedArtLoaded)+";",
 "export default function Sandbox() {",
 " return <View style={{ flex: 1, backgroundColor: '#130D31' }}>",
 "  <View style={{ backgroundColor: '#422139', paddingTop: 24, paddingBottom: 7, paddingHorizontal: 10 }}><Text style={{ color: '#FFE3A6', textAlign: 'center', fontWeight: '700', fontSize: 10 }}>VEE TEST ONLY • UI SANDBOX • NO LOGIN / PAYMENT / FIREBASE</Text>",
 "  {!artworkLoaded ? <Text style={{textAlign:'center',color:'#FFE3A6',fontSize:10}}>APPROVED ART PENDING UPLOAD • LEGACY EMBLEMS</Text>:null}</View>",
 "  <VeeRoyalSvipScreen",
 "    tiers={SVIP_TIERS_FALLBACK.map(t => ({ ...t }))}",
 "    privileges={SVIP_PRIVILEGES_FALLBACK.map(p => ({ ...p }))}",
 "    assets={{emblemUrls: artworkLoaded ? frames : liveEmblems, frameUrls:frames, badgeUrls:badges}}",
 "    previewOnly={true} activeTier={null} isWaitlisted={false} isJoining={false}",
 "    onBack={() => {}} onJoinWaitlist={() => {}}",
 "  />",
 " </View>;",
 "}",
].join('\n') + '\n';
write(path.join(routeDir,'index.tsx'), index);

// Isolated application ID, scheme, EAS update channel and runtime.
// Runtime intentionally differs from production. Every publish command MUST
// additionally target the explicit sandbox channel only.
cfg.expo.extra = cfg.expo.extra || {};
cfg.expo.extra.eas = {projectId: sandboxProjectId};
if (sandboxOwner) cfg.expo.owner = sandboxOwner;
cfg.expo.updates.url = 'https://u.expo.dev/' + sandboxProjectId;
cfg.expo.name = 'Vee SVIP Sandbox';
cfg.expo.android.package = sandboxPackage;
cfg.expo.scheme = 'vee-svip-sandbox';
cfg.expo.runtimeVersion = sandboxRuntime;
cfg.expo.plugins = ['expo-router','expo-font'];
cfg.expo.android.permissions = ['android.permission.INTERNET'];
cfg.expo.android.blockedPermissions = [
 'android.permission.CAMERA','android.permission.RECORD_AUDIO',
 'android.permission.READ_MEDIA_IMAGES','android.permission.READ_MEDIA_VIDEO',
 'android.permission.POST_NOTIFICATIONS','android.permission.BLUETOOTH_CONNECT'
];
delete cfg.expo.android.googleServicesFile;
delete cfg.expo.android.intentFilters;
delete cfg.expo.notification;
delete cfg.expo.ios;
if (cfg.expo.extra) delete cfg.expo.extra.router;
write(cfgPath, JSON.stringify(cfg,null,2) + '\n');

const eas = {
 cli:{version:'>= 16.0.0',appVersionSource:'local'},
 build:{
  'svip-sandbox':{
   channel:sandboxChannel, distribution:'internal', developmentClient:false,
   android:{buildType:'apk'},
   env:{EXPO_PUBLIC_API_BASE_URL:'https://invalid.example.invalid',VEE_SANDBOX_MODE:'1'},
  },
 }
};
write(path.join(appRoot,'eas.json'), JSON.stringify(eas,null,2)+'\n');

// Scoped TypeScript gate: check ONLY the files the sandbox ships. The frozen
// tree contains production files with pre-existing errors (dead modules and
// optional Expo packages that are not installed) which Metro never bundles
// and which must not fail the sandbox build.
write(path.join(appRoot,'tsconfig.sandbox.json'), JSON.stringify({
  extends: './tsconfig.json',
  include: ['expo-env.d.ts','app/_layout.tsx','app/index.tsx','src/features/svip/VeeRoyalSvipScreen.tsx','src/features/svip/svipRoyalDesignConfig.ts'],
}, null, 2) + '\n');

const previewRoutes=fs.readdirSync(routeDir).sort().join(',');
assert(previewRoutes === '_layout.tsx,index.tsx','Unsafe routes survived in preview: '+previewRoutes);
const cfgVerify=readJson(cfgPath);
const easVerify=readJson(path.join(appRoot,'eas.json'));
assert(cfgVerify.expo.extra.eas.projectId===sandboxProjectId && cfgVerify.expo.updates.url === 'https://u.expo.dev/'+sandboxProjectId, 'Live Expo project URL survived sandbox sanitizing.');
assert(cfgVerify.expo.android.package===sandboxPackage, 'Not isolated Android ID.');
assert(cfgVerify.expo.runtimeVersion===sandboxRuntime,'Not isolated runtime.');
assert(!cfgVerify.expo.android.googleServicesFile,'Production Google Services file is still configured.');
assert(easVerify.build['svip-sandbox'].channel===sandboxChannel,'Unsafe OTA channel');
assert(has(path.join(appRoot,'tsconfig.sandbox.json')), 'Sandbox tsconfig missing.');
assert(!('production' in easVerify.build),'Production EAS profile must not exist in sandbox.');

const importedCode=fs.readFileSync(path.join(appRoot,'src/features/svip/VeeRoyalSvipScreen.tsx'),'utf8');
assert(!/from ['"](?:firebase|@firebase|expo-router|@\/src\/context)/.test(importedCode),
 'Draft UI imports production auth, Firebase or router.');
assert(!/fetch\(|\.set\(|\.update\(/.test(importedCode), 'Draft UI contains unreviewed external writes.');
console.log('PASS: immutable source SHA:',sourceCommit);
console.log('PASS: independent Expo sandbox project ID verified');
console.log('PASS: Expo owner:', cfgVerify.expo.owner);
console.log('PASS: sandbox package:',sandboxPackage,'channel:',sandboxChannel,'runtime:',sandboxRuntime);
console.log('PASS: routes:',previewRoutes,'no imported auth/database/wallet in sandbox UI');
console.log('ART:', approvedArtLoaded ? 'All 10 approved WebP files included' : 'No art uploaded: legacy public emblem images used as read-only preview');
console.log('PASS: no production EAS profile, no original repository writes, no API, no Firebase UI routes.');
