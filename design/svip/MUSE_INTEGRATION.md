# Vee — Snake–Dragon Royal Luxury SVIP handoff for Muse

## Source and write boundaries
- **READ ONLY**: \`sumon573/Updated-vee-code\`, branch \`base-working-version\`, commit \`46fe4e39\`. Never edit, commit, or push to this repository from this handoff.
- **DRAFT ONLY**: \`sumon573/vee-drafts\`, branch \`main\`.
- Working/shipping branch of the real app requires separate, explicit user permission.
- Follow \`Vee Brain.md\` and the user's approved screenshots. The master brief was not independently available in this workspace.

## What is in this handoff
- \`src/features/svip/VeeRoyalSvipScreen.tsx\` — pure React Native/Expo UI. No direct Firebase, no router, no wallet code, no new package, no fake payment. All data/actions come from the host.
- \`src/features/svip/svipRoyalDesignConfig.ts\` — exact user-provided tiers, currently enforced privilege thresholds, asset filenames and theme.
- **Approved static membership badge progression** — five distinct badges (SVIP1–5).
- **Selected static ring/frame concepts** — five dragon frames, each with \`SVIP1\` ... \`SVIP5\` bottom plate, open transparent center.
- The **PNG/WebP binary art is NOT in this GitHub repository** until the ZIP assets are separately uploaded. The ChatGPT handoff ZIP contains them; do not substitute a dead URL or a random stock image.

## Exact values — no invented rewards
| Tier | 30-day price | Privileges available from this tier |
| --- | ---: | --- |
| SVIP 1 | 10,000 diamonds | Membership badge; Nameplate |
| SVIP 2 | 20,000 diamonds | + Entry Effect |
| SVIP 3 | 30,000 diamonds | + Anti-Kick; Kick-Out |
| SVIP 4 | 40,000 diamonds | No additional privilege |
| SVIP 5 | 60,000 diamonds | No additional privilege |

**Only these five privileges exist.** Dragon profile frames are selected **visual overlay designs**, not a newly invented sixth entitlement. Existing points, if any, must remain owned by the real app; this UI must not invent points or amounts.

## Existing real code examined (read-only)
- \`artifacts/vee/app/svip.tsx\` renders \`SvipScreen\`.
- \`artifacts/vee/src/features/svip/SvipScreen.tsx\` reads real membership and points, chooses tier, renders art and routes Join to the waitlist.
- \`artifacts/vee/src/features/svip/svipConfig.ts\` gets server overrides from RTDB \`svip_config\`; existing fallback prices are correct.
- \`artifacts/vee/src/features/svip/svipService.ts\` subscribes \`svip/{uid}\` and joins \`svipWaitlist/{uid}\`.
- Keep existing \`svip_design\` integration consistent with the live schema after Muse inspects it. Do NOT guess or create new server keys.
- Existing code uses the rose-pink Vee diamond and \`#130D31\` / \`#E8B84B\` primary colors.

## Muse integration contract
1. Keep real routing \`/svip\`, real authorization, expiry, waitlist and server-driven prices/privileges in host code. They must not be replaced by draft UI logic.
2. Resolve art URLs from the existing server design setup. If art/config is missing, display **the unchanged existing SVIP screen** — not broken images or a fake completed screen.
3. Pass \`getSvipTiers()\`, \`getSvipPrivileges()\` and real active/waitlist states as props to \`VeeRoyalSvipScreen\`. Prop \`onJoinWaitlist\` must call the existing verified waitlist function; never charge diamonds here.
4. For rewards, show **badge, nameplate, entry effect, anti-kick and kick-out only**. Use the provided profile frame asset purely as a cosmetic visual; don't claim it unlocks separately.
5. \`onPreviewEntryEffect\` is optional and should remain **unset** until a real animation is approved. Rejected orbiting/head-only prototypes are not production assets; any future preview plays once and stops with head staying at its position.
6. Images use \`expo-image\`. No continuous loops, no new dependencies, and no cross-screen refactoring. Android portrait performance and transparency must be tested on a real device.
7. Do not touch production or working branches without explicit permission.

## Asset approval state
- Membership badge SVIP 1–5: **approved** (static).
- SVIP ring/frame SVIP 1–5: **selected static visual direction**, final installation pending artwork upload.
- Nameplate final design: **PLACEHOLDER**.
- Entry Effect animation: **PLACEHOLDER (NOT APPROVED)**.
- Anti-Kick and Kick-Out independent art: **PLACEHOLDER**.
- Server/CDN URLs for new art: **PLACEHOLDER**.
- Purchase endpoint: **not implemented**; CTA remains waitlist only.

## Never claim
Do not say the new design is installed or phone-tested. These are **draft integration files**. Never claim binary art is in GitHub unless the actual file appears in the GitHub tree and can be fetched.
