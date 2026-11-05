# Design audit record — YoHo clone design system (replica-design)

Date: 2026-11-05. Auditor: replica-design step, with ui-ux-pro-max (candidates),
ponytail-review, hallmark-audit, and impeccable (review lenses). All findings
below were fixed in the deliverables before this report, except where noted as
a deferred item or a waiver with a stated reason.

Deliverables audited: `tokens.json`, `tokens.css`, `tokens.ts`, `components.md`
(all under `~/workspace/yoho-clone/design/`).

---

## 1. ui-ux-pro-max — design-system candidates

Three candidates were generated; Candidate A was picked. The full rationale
is in `components.md` ("Design decisions").

- **Candidate A — Deep Teal / Dark Slate (PICKED).** Accent deep teal
  #0f766e; room gradient teal-900 -> slate-900; light bg white. Distinct
  from YoHo on every signature; accent (teal) is a different hue family
  from VIP (amber), so the accent and the premium badge can never be
  confused; contrast passes AA on all 29 pairs; a dark room is right for
  voice focus and battery.
- **Candidate B — Warm Amber / Charcoal (REJECTED).** Accent amber #b45309.
  The accent collides with VIP gold — the primary action and the premium
  badge would be the same hue family, so a badge's meaning would rely on
  colour alone; amber is also close to YoHo's gold (VIP) and to Vee's own
  SVIP gold, a brand-confusion risk.
- **Candidate C — Indigo / Ink (REJECTED).** Accent indigo #4338ca; room
  indigo-950 -> slate-900. Indigo/violet is YoHo's signature room colour —
  the room would read as a "purple room" like YoHo (trade-dress risk).

Adapted pre-delivery checklist (ui-ux-pro-max, filtered for this app):
- Contrast minimums: KEPT — 29 pairs, 0 AA failures (contrast.py, exit 0).
- Text reflow without clipping: KEPT — no fixed heights on text containers;
  grid items use flexShrink: 1 + minWidth: 0.
- Chips/badges whole-or-disclosed: KEPT — chips wrap or use a "+n"
  disclosure; a badge's meaning never relies on colour alone (icon + label).
- Reduced-motion: KEPT — animations stop, final state stays correct;
  gift/entrance animations fall back to a static image + a text announcement.
- Responsive at phone widths: KEPT — phone-first, maxWidth 420, 2-col grid.
- REJECTED (do not apply): "no emojis as icons" (the clone uses an open
  icon set; its own illustrations/gift art are commissioned, and the boss's
  glossy 3D sticker characters stand where used); cursor-pointer and
  keyboard-focus items (web-only, meaningless in React Native — the RN
  equivalent, a visible focus ring for TV/keyboard, IS specified);
  landing-page patterns (hero/testimonials/CTA-above-fold do not map to
  voice-room screens).
- PREMIUM tier: EXCLUDED (paid, off the table under the zero-cost standard).

---

## 2. ponytail-review — the laziest senior dev

What the change does: a complete design system (tokens + 38 component specs)
for a new, separate Expo app (the YoHo clone), measured from the recon
screenshots, with the clone's own provisional palette.

Ladder:
1. Does it need to exist? Yes — the boss ordered the full clone; replica-design
   is step 3 of the replica workflow, and the build step needs tokens + specs.
2. Already in this codebase? The STRUCTURE (tokens.json + tokens.ts +
   components.md) and the stack (Expo + RN + StyleSheet) are reused from Vee.
   Vee's TOKENS are NOT reused — the clone is a separate app with its own
   brand (replica-brand gives it its own identity); reusing Vee's tokens
   would make the clone look like Vee, which defeats the purpose.
3. Standard library / native? Not applicable (a design system, not code).
4. Installed dependency? One: an open icon set (Lucide, MIT) for the build
   step. Justified — a single icon dependency beats drawing 40+ icons.
   Inter is a font stack, not an install.
5. One line a reader gets? No — a design system is inherently a file set.
6. Minimum that works? The token set (43 colours, 29 pairs) was checked for
   bloat: every token is used by at least one component spec. The tag tokens
   (8) serve the 4 topic chips; the room tokens (8) serve the core screen;
   the soft variants serve banners/chips; the currency tokens are functional
   labels; the game tokens (5) serve the Ludo/Dominoes boards; the overlay
   token serves scrims. Nothing could be cut safely without losing a
   component's spec — so nothing was cut (per the skill: "If nothing can be
   cut safely, say so in one line — do not invent cuts").

What can go wrong (found and fixed):
- `vip` (#d97706) as small text would fail AA (3.19:1 on white, large-only).
  Fix: the tokens now note `vip` is large-text-only; small amber text must
  use `tag-party-text` (#92400e, 6.37:1 on its bg). The Level/charm badge
  and Party tag specs already use the darker amber.
- Tag tokens used as solid backgrounds with white text would fail AA (e.g.
  white on sky #0ea5e9 is 2.78:1). Fix: the tokens now note the tag tokens
  are soft-chip pairs (light bg + dark text) only, never solid backgrounds
  with white text.
- The `danger` token initially failed on `danger-soft` (4.41:1). Fix: danger
  darkened to #b91c1c (now 5.91:1 on danger-soft, 6.47:1 on bg).
- The room gradient could read as a flat dark screen (the core screen).
  Fix: see impeccable P0 (radial glow + vignette + prominent halo).

What happens if it is skipped: the build step would have no tokens and would
invent colours per screen — the clone would look inconsistent and could
accidentally copy YoHo's brand colours.

What was skipped / not checked: no code was written or reviewed (this step is
tokens + specs only; the primitives are built in replica-build, where the
ponytail ladder applies to the code). No phone verification exists yet for
this design (a design system counts as done only when its primitives run on
a real phone in the build step). Risk the user must know: the palette is
PROVISIONAL pending replica-brand — the brand step may change the accent
and room values, and the contrast check must be re-run after any change.

---

## 3. hallmark-audit — Floor gates (applies to the CSS/token files)

Scope note: Hallmark's gates are written for HTML/CSS web pages. This design
system targets a React Native app, so the gates were applied where they fit
(tokens.css + the spec document) and marked not-applicable where they do not
(no rendered web page exists). This is an audit, not a redesign.

Floor findings (all fixed):
- Gate 1 (colours/fonts through tokens at :root). FIXED: the game colours
  (Ludo quadrants, Dominoes felt) and the scrim colour were literal hex/rgba
  values in the specs; they are now tokens (`game-ludo-*`, `game-felt`,
  `overlay`) declared in tokens.json/css/ts and referenced by name in
  components.md. Every other colour in the specs now references a token name.
- Gate 2 (never `transition: all`; never animate width/height/top/left).
  FIXED: added to the rules — "Animations use transform and opacity only".
  tokens.css contains no transitions.
- Gate 5 (grid tracks `minmax(0, 1fr)`; display heads `overflow-wrap` +
  `min-width: 0`). FIXED (RN equivalent): added to the rules — "Grid items
  use flexShrink: 1 and minWidth: 0 so long titles wrap instead of
  overflowing."
- Gate 6 (every interactive element has `:focus-visible`). PASS: every
  component spec includes a visible focus state (2px ring, accent) and a
  screen-reader label.
- Gate 7 (every animation has a `prefers-reduced-motion` fallback). PASS:
  the rules require reduced-motion fallbacks (animations stop, final state
  correct; gift/entrance fall back to a static image + announcement).
- Gate 8 (never an invented metric/testimonial/logo wall). PASS: no invented
  metrics; example values in the specs come from the recon (screenshots and
  verified price tables), not invented.
- Gate 9 (never an eyebrow; never tracked capitals / small caps). PASS: no
  eyebrows; section titles are sentence case (the Settings row spec states
  this explicitly).
- Gate 10 (never middle-dot-joined meta strings; never decorative status
  dots). FIXED: the Profile header meta line is now specified as
  comma-separated (wraps to a second line), never middle-dot-joined. The
  LIVE dot and the tab dot are NOT decorative-alone — each accompanies a
  written label ("LIVE", the tab name) and the selected state is also
  conveyed by text weight/colour.
- Gate 11 (never a purple-to-blue gradient; never a card inside a card;
  never an emoji as an icon). PASS: the room gradient is teal-slate (not
  purple-blue); no card-inside-a-card exists (sheets contain grid items,
  not nested cards); icons are an open icon set, not emojis.
- Gate 14 (container capped and centred). PASS: layout maxWidth 420, centred.
- Gate 15 (Hallmark stamp as the first line). NOTE (not a failure): applies
  only to pages built with Hallmark; tokens.css is not a Hallmark page.

Waivers (with a real reason, stated on record):
- The Facebook (#1877f2) and TikTok (#000000) sign-in button colours are
  the providers' own brand marks for login — platform conventions users
  recognise. They are not the clone's tokens and are not YoHo's colours.
- Gate 4 (`overflow-x: clip` on html/body), gate 12 (hero visible at
  1280x800), gate 13 (~80 words per screen), gate 16 (local render check):
  NOT APPLICABLE — there is no web page here (React Native design system;
  no html/body, no landing-page hero, mobile app screens are content-rich,
  and no rendered page exists to check).

What was not checked: a local render check (no rendered page exists — the
design system is tokens + specs for React Native, not a web page).

---

## 4. impeccable — review (critique + audit), ranked findings

The bar: killer-level, fully premium polished. Findings are ranked P0 (blocking)
to P3 (polish). All findings were fixed in the deliverables.

- **P0 — The room background risks feeling flat and lifeless.** The room is
  the core screen (where users spend most of their time). A flat dark
  teal-slate gradient would read as a plain dark screen, not a premium voice
  room. FIXED in the Mic seat spec: a radial teal glow behind the host
  (room-glow at 25% opacity, 200px diameter) plus a subtle vignette (the
  gradient darkens toward the edges), and a more prominent speaking halo
  (two concentric rings — inner solid teal 2px, outer fading ring expanding
  to 1.4x over 1600ms — clearly visible at arm's length).
- **P1 — The mic button does not hint that voice filters exist.** The
  6-step activation flow (long-press mic -> audio settings -> filters) is
  hidden; a user who never long-presses the mic never discovers it. FIXED
  in the Chat input bar spec: a small accent dot on the mic button when
  voice filters are available but not unlocked, with a screen-reader
  announcement that voice filters can be opened from it.
- **P1 — The VIP progress fill is a flat amber, close to the warning
  orange.** FIXED in the VIP tier card spec: the fill is now a gradient
  from coin #f59e0b to vip #d97706 (amber to gold), which reads as premium
  and is distinct from the flat warning orange.
- **P2 — Chat bubbles are solid slate; a translucent glass-like bubble
  would feel more premium.** FIXED in the Chat message row spec: the bubble
  is implemented as translucent white at 12% opacity over the gradient,
  with the solid room-surface as the effective/fallback colour.
- **P2 — Gift / entrance art is not yet commissioned.** The design specs the
  slots (gift panel, gift animation, entrance effect, avatar frames, cars,
  banner art) but the art itself does not exist yet. NOT a design flaw — a
  dependency. The build cannot be premium without it; the art must be
  commissioned (or the brand step must supply it) before replica-build.
  DEFERRED to replica-brand / the art commission, not to this step.
- **P3 — The light content screens are clean but plain.** The premium feel
  relies on the banner art + cards + the raised centre Create button. The
  section titles are already 20px/700 with generous spacing; no further
  change was made (adding decoration for its own sake would be slop).

`detect` (the deterministic slop detector): NOT RUN — no TSX sources exist
yet (this step is tokens + specs only). It runs in replica-build once the
primitives are written. Rendered-page rules do not apply to React Native
screens (there is no web URL to scan).

What was not checked: no rendered screen exists yet (the primitives are built
in replica-build), so no phone check of this design has happened. A design
system counts as done only when its primitives run on a real phone.

---

## Summary

- Contrast: 29 pairs, 0 AA failures (contrast.py, exit 0).
- Candidates: 3 generated, Candidate A (Deep Teal / Dark Slate) picked.
- Audit findings: 9 fixed across the three lenses (2 ponytail usage rules,
  4 hallmark Floor fixes, 3 impeccable fixes) + 1 deferred dependency
  (gift/entrance art commission) + 2 stated waivers (provider login-button
  colours; web-only gates not applicable to a React Native design system).
- The design system is a CANDIDATE (ui-ux-pro-max output contract), awaiting
  his pick. Never "shipped".
