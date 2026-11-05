# Component specs — YoHo clone design system (replica-design)

Design system: **Candidate A — Deep Teal / Dark Slate** (chosen by ui-ux-pro-max
over Candidate B Warm Amber and Candidate C Indigo; see "Design decisions" below).
Tokens: `tokens.json` (source of truth), `tokens.css`, `tokens.ts`.
Stack: Expo (React Native) + TypeScript, StyleSheet + tokens (no Tailwind — the
app is React Native; `tokens.ts` is the theme object).
Palette: PROVISIONAL pending replica-brand. Accent is deep teal, NOT YoHo's
vivid green; the room theme is a dark teal-slate gradient, NOT YoHo's
violet-cyan. No YoHo logos, brand colours, art, copy or trademarks are used.
Icons: an open icon set (Lucide). Illustrations, gift art, entrance art,
avatar frames and car art are commissioned by the clone — never YoHo's.

Rules every component follows (resilient UI, premium bar):
- Touch targets are at least 44px (iOS) / 48px (Android).
- Text reflows without clipping: no fixed heights on text containers; long
  strings wrap or truncate with an ellipsis + a "more" disclosure, never
  cut mid-word.
- Chips/badges wrap or use a "+n" disclosure; a badge's meaning never relies
  on colour alone — always an icon + a written label/number.
- Reduced motion is respected: animations stop and the final state stays
  correct; gift/entrance animations fall back to a static image + a text
  announcement.
- Text scaling is supported (no fixed pixel text that cannot grow).
- Every interactive element has a visible focus state (2px ring, accent)
  and a screen-reader label; icon-only buttons always have an
  accessibilityLabel.
- Numbers that change (countdowns, timers, balances) use tabular figures
  so digits do not jump.
- Currency amounts are always dark text on light (or white text on dark)
  with a currency icon; the currency colour is never the only signal.
- Animations use transform and opacity only — never width, height, top, or
  left; never transition: all.
- Grid items (room cards, moment cards) use flexShrink: 1 and minWidth: 0
  so long titles wrap instead of overflowing.

---

## Primitives

Button
  variants  primary (accent bg, white text), secondary (surface bg, dark text,
            border), ghost (transparent, accent text), danger (danger bg, white
            text), on-dark (translucent white bg, white text — on the room gradient)
  sizes     sm 32px, md 40px, lg 48px, xl 56px (primary CTA)
  states    default, pressed (accent-strong bg, scale 0.97), focus-visible
            (2px ring, accent, offset 2px), disabled (opacity 0.5, no press),
            loading (spinner + label kept for screen readers)
  tokens    bg accent / surface / transparent, text on-accent / text / accent,
            radius pill, font sm/600 (md), base/600 (lg)
  a11y      Pressable, accessibilityRole button, accessibilityLabel is verb +
            target (e.g. "Join room"), disabled sets accessibilityState.disabled,
            loading announces "loading" and keeps the label
  used on   S03, S05, S07, S13, S18, S19, S20, S21, S26, S31, S33

TextInput
  variants  text, password, search, numeric (OTP / code), multiline (bio)
  sizes     md 48px height (multiline grows, min 96px)
  states    default (border-input), focused (border accent, 2px ring accent-soft),
            error (border danger + error text below, 13px danger), disabled
  tokens    bg bg, border border-input, text text, placeholder text-muted,
            radius md
  a11y      accessibilityLabel per field, error announced, secureTextEntry for
            password, keyboardType set per variant, multiline has a character
            count when capped
  used on   S03, S04, S07 (chat input is Chat input bar), S30, S31

Badge / Chip (topic tag, count chip)
  variants  topic tag (soft chip: Chat teal, Sing sky, Dating rose, Party amber —
            see tokens tag-*), count chip (white text on dark scrim, over photos),
            status chip (LIVE, Full, Ended)
  sizes     topic tag 24px tall, 12px/600 text, radius pill, 8px horizontal padding;
            count chip 20px tall, 12px/600
  states    default; topic tags are not interactive (they are labels); a selected
            tag (in the create-room form) gets an accent border + accent-soft bg
  tokens    tag-chat-*, tag-sing-*, tag-dating-*, tag-party-*; count chip bg
            rgba(15,23,42,0.55), text #ffffff
  a11y      tag meaning is the written topic name (never colour alone); the count
            chip label is "35 listeners"; a LIVE chip has a pulsing dot + the
            word "LIVE", not a dot alone
  used on   S05, S06, S13, S31

Avatar
  variants  plain, speaking (halo), muted (mic-off badge), VIP (frame overlay),
            empty (+ placeholder)
  sizes     xs 24, sm 36, md 48, lg 64, xl 96 (host), xxl 110 (profile)
  states    default, speaking (halo rings, see Mic seat), muted (mic-off badge
            bottom-right, 20px dark circle), VIP (frame overlay, decorative)
  tokens    border for VIP frame (vip), halo room-glow
  a11y      accessibilityLabel is name + state (e.g. "Isabel, speaking");
            a VIP frame is decorative (aria-hidden)
  used on   S05, S07, S13, S16, S18, S19, S32, S34

Toggle / Switch
  variants  on, off
  sizes     track 48x28, thumb 24
  states    on (accent bg, thumb right), off (border-input bg, thumb left),
            focus-visible (2px ring, accent), disabled (opacity 0.5)
  tokens    bg accent / border-input, thumb #ffffff, radius pill
  a11y      accessibilityRole switch, accessibilityState.checked, label is the
            setting name (e.g. "Anyone can take a seat")
  used on   S08, S27, S28

Slider (intensity)
  variants  single (voice filter intensity 0-100)
  sizes     track 4px tall, thumb 24px circle, full width
  states    default, dragging (thumb scales 1.1), disabled
  tokens    track surface-2, fill accent, thumb #ffffff with border accent
  a11y      accessibilityRole adjustable, value announced as a percentage,
            step 1, min 0 max 100
  used on   S09

Toast / Modal sheet
  variants  toast (bottom, dark bg #0f172a, white text, 48px, radius pill,
            auto-dismiss 3s, optional action button), bottom sheet (bg bg,
            radius xl top corners, drag handle, scrim (overlay token), content
            scrollable, close on scrim tap / swipe down / close button)
  sizes     toast max-width 90% of screen; sheet max-height 85% of screen
  states    open, closing (motion slow, 400ms), dismissed
  tokens    toast bg text, text #ffffff; sheet bg bg, scrim overlay
  a11y      toast is announced (live region); sheet traps focus, scrim tap and
            back gesture dismiss, close button labelled "Close"
  used on   S08, S09, S20, S22 (gift panel is a bottom sheet)

---

## Navigation

Bottom nav
  variants  5 tabs: Home, Moments, Create (+) centre, Messages, Me
  sizes     height 56 + safe-area inset; centre Create is a raised circle
            56px (accent bg, white + icon, shadow pop); tab icons 24px,
            labels 12px/600
  states    active (accent icon + accent label), inactive (text-muted icon +
            label), badge (danger bg, white text, 16px min, pill, on Messages)
  tokens    bg bg, border-top border, text accent / text-muted, badge danger
  a11y      each tab is a button with a label; the badge count is announced
            ("Messages, 20 unread"); Create is labelled "Create a room"
  used on   S05, S13, S17, S19
  note      the site-home mockup shows 3 tabs; the real app has 5 (recon) —
            the spec is 5 tabs

Tabs (Hot / Related)
  variants  text tabs with a dot indicator under the selected tab
  sizes     text 16px/600; dot 6px, accent; gap 24px between tabs
  states    selected (text, dot visible), unselected (text-muted, no dot)
  tokens    text text / text-muted, dot accent
  a11y      accessibilityRole tab, accessibilityState.selected, tab list role
  used on   S05, S13

Header (top bar)
  variants  light (on content screens: bg bg, text text) and on-dark (on the
            room gradient: transparent, text room-text)
  sizes     height 56; title 20px/600; action icons 24px, 44px touch target
  states    default; title may be replaced by tabs (see Tabs)
  tokens    bg bg / transparent, text text / room-text, icons text / room-text
  a11y      back button labelled "Back"; every icon button labelled (e.g.
            "Search", "Notifications", "More options")
  used on   S03, S05, S07, S13, S18, S19

---

## Discovery

Room card
  variants  live, full (dimmed + "Full" badge), ended (greyed, not tappable)
  sizes     2-column grid, gap 8, radius lg (16), cover aspect 3:4, page
            padding 16
  states    live (pulsing LIVE dot + listener count), full, ended
  tokens    bg bg, border border (subtle), topic tag tag-* (top-left),
            listener chip (top-right, white text on dark scrim), room name
            (bottom-left, white 16px/600) over a bottom gradient scrim
            (transparent -> overlay token)
  a11y      the whole card is a button; label is room name + topic + listener
            count + live status (e.g. "SunHine Music, Chat, 35 listeners, live")
  used on   S05, S06

Banner carousel
  variants  promo banner (headline + one sentence + optional CTA)
  sizes     full width, aspect 16:9, radius lg; dots: active is a white pill
            16px wide, inactive is a white 6px dot at 50% opacity
  states    auto-scroll every 5s, paused on touch/focus, dots are buttons
  tokens    bg is the banner art (the clone's own commissioned art); text
            #ffffff; dots #ffffff
  a11y      carousel is a region; dots are buttons ("Go to slide 2");
            auto-scroll stops on focus and under prefers-reduced-motion
  used on   S05

Activity room card
  variants  live, full
  sizes     full width, radius lg, cover image, title in a white pill at top,
            "users online" with a person icon, Join button (primary, pill)
            on the right
  states    live, full (Join disabled, "Full" badge)
  tokens    bg bg, border border, title text, Join primary
  a11y      card is a button; label is title + users online (e.g. "Akilah is
            holding birthday party, 128 users online")
  used on   S06

Search field
  variants  a TextInput with a search icon left and a clear button right
  sizes     height 44, radius pill, bg surface, no border
  states    empty (placeholder "Search rooms and people"), typing (clear
            button visible), results (list below)
  tokens    bg surface, text text, placeholder text-muted, icon text-muted
  a11y      labelled "Search"; clear button labelled "Clear search"
  used on   S30

---

## Room (the core screen — dark theme)

Mic seat
  variants  host (large, centred, glow + rings), guest, empty (+), locked
  sizes     host avatar 96px; guest avatar 64px; name below 12px/500 room-text;
            empty/locked circle 64px (room-surface at 50%)
  states    speaking (two concentric halo rings — inner solid teal 2px, outer
            fading ring — pulsing 1600ms), muted (mic-off badge bottom-right,
            20px dark circle), empty (+, white 24px), locked (lock icon)
  tokens    room-bg gradient, room-text, room-text-muted, room-surface,
            room-glow (#14b8a6) for the halo, accent for the active speaker
  a11y      each seat is a button; label is occupant + state (e.g. "Isabelle,
            speaking", "Empty seat, tap to join", "Seat 8, locked")
  used on   S07
  note      premium room depth (impeccable P0 fix): the host gets a radial
            teal glow behind the avatar (room-glow at 25% opacity, 200px
            diameter) plus a subtle vignette (the gradient darkens toward
            the edges) so the room never reads as a flat dark screen. The
            speaking halo is two concentric rings — inner solid teal 2px,
            outer fading ring expanding to 1.4x over 1600ms — clearly visible
            at arm's length. Without the glow + vignette + halo, the room is
            a plain dark screen, not a premium voice room.

Chat message row
  variants  text, gift (gift icon + "X sent Y a Rose"), system (centred,
            no bubble, e.g. "X joined the room")
  sizes     avatar 36px left; name 14px/600 room-text + level badge inline;
            bubble room-surface (implemented as translucent white at 12%
            opacity over the gradient — the solid room-surface is the
            effective/fallback colour; the glass-like translucency is the
            premium feel), radius lg, 14px room-text, 8px padding vertical,
            12px horizontal; system text 12px room-text-muted
  states    default, gift, system
  tokens    room-surface, room-text, room-text-muted
  a11y      the message list is a log; each message label is sender + text;
            gift messages announce the gift name and count
  used on   S07, S16

Chat input bar
  variants  room input bar (pill input + circular icon buttons)
  sizes     input 44px, radius pill, room-surface bg; icon buttons 44px circles,
            room-surface bg, room-text icons; gift button uses accent bg
            (it is the money action and must stand out)
  states    default, focused (border accent), typing, muted (mic off state),
            filter-available (a small accent dot on the mic button when voice
            filters are available but not unlocked — it hints the filter flow
            exists instead of hiding it behind a 6-step long-press)
  tokens    room-surface, room-text, room-text-muted, accent (gift button)
  a11y      input labelled "Message"; each icon button labelled ("Emoji",
            "Send a gift", "Speaker", "Microphone", "More"); the mic button
            announces its mute state and, when filters are available, that
            voice filters can be opened from it
  used on   S07

Gift panel
  variants  bottom sheet (radius xl top corners, bg bg); category tabs
            (Classic, Luxury, Event — the clone's own categories); grid 4 columns
  sizes     gift cell: image 64px (the clone's own art) + name 12px text +
            price chip (currency icon + amount, 12px text-muted); send button
            primary lg full-width; count stepper (- 1 +) 40px
  states    default, selected (accent 2px border + accent-soft bg),
            insufficient balance (price chip danger + a "Recharge" button),
            sending (loading)
  tokens    bg bg, border border, selected accent / accent-soft, price
            text-muted, danger for insufficient balance
  a11y      the grid is a list; each gift is a button labelled with name +
            price (e.g. "Rose, 500 coins"); insufficient balance is announced;
            the send button is disabled when nothing is selected
  used on   S07, S16, S22

Gift animation
  variants  full-screen overlay (the gift's animation plays over the room —
            the clone's own art, Lottie or video, ~3s, plays once)
  sizes     full screen; does not block input (taps pass through) except a
            close button
  states    playing, finished (auto-dismiss), reduced-motion (static image +
            text announcement instead)
  tokens    none (art is the clone's own); announcement uses room-text
  a11y      decorative (aria-hidden); a text announcement is made ("X sent a
            Rose to Y")
  used on   S07

Avatar frame
  variants  VIP (amber/gold ring), event (themed ring) — the clone's own art,
            never YoHo's
  sizes     sized to the avatar it frames (overlay image, not a border)
  states    none (decorative)
  tokens    vip for the VIP frame
  a11y      decorative (aria-hidden)
  used on   S07, S18, S19, S21

Level / charm badge
  variants  level (star icon + number), charm (heart icon + number)
  sizes     pill 20px tall, 11px/700 text, 6px horizontal padding, icon 12px
  states    none (always visible next to a name)
  tokens    level: accent-soft bg + accent text; charm: vip-soft bg + #92400e
            text (tag-party-text token — the darker amber passes AA on the
            light amber bg)
  a11y      label is "Level 90" / "Charm 199" (icon + number, never colour alone)
  used on   S07, S18

Entrance effect
  variants  full-screen animation when a VIP user joins a room (the clone's
            own art — car, airship, creature — ~3s, plays once)
  sizes     full screen; does not block input
  states    playing, finished, reduced-motion (no animation, just a toast
            "X joined")
  tokens    none (art is the clone's own)
  a11y      decorative (aria-hidden); a text announcement is made
  used on   S07, S21

Voice filter picker
  variants  bottom sheet; category tabs ("Premium 2026" and others); filter
            rows; intensity slider for the active filter
  sizes     row 64px: name 16px/600, description 14px text-muted, preview
            button (play icon, 40px circle); unlock button primary lg
  states    locked (lock icon + price "7,000 coins"), owned (check), active
            (accent dot + "Active"), preview playing (pause icon)
  tokens    bg bg, border border, accent (active), text / text-muted
  a11y      each filter is a button; its state is announced ("Anime Voice,
            locked, 7,000 coins"); the slider is adjustable with a percentage
            value
  used on   S09

Room settings
  variants  a settings list (capacity stepper, entry condition segmented
            control, mic seat rule toggles, who can join/listen/interact,
            premium-room controls)
  sizes     row 56px: label 16px text + description 13px text-muted below;
            control on the right
  states    on/off (toggles), disabled for non-hosts
  tokens    bg bg, border border, text / text-muted, Toggle component
  a11y      each setting is labelled; toggles announce their state; the entry
            condition is a radio group (Open / Password / Invite-only)
  used on   S08

---

## Games

Game board
  variants  Ludo, Dominoes, Uno, arcade fishing, Parcheesi — one container,
            the board type switches the inner layout
  sizes     the board fills the upper area; player avatars around the edges;
            the room chat bar stays visible at the bottom; "Onlookers" label
            12px room-text-muted + spectator count
  states    waiting (lobby, "Waiting for players"), playing (current player's
            seat highlighted with an accent ring), finished (winner + trophy),
            spectator (board visible, no moves allowed)
  tokens    Ludo quadrants use the game's standard colours (game-ludo-red,
            game-ludo-green, game-ludo-yellow, game-ludo-blue — the game's
            inherent colours, not YoHo's brand); Dominoes felt is game-felt;
            board bg room-surface; text room-text
  a11y      the board is a region; every move is a button; the turn is
            announced ("Your turn"); the game state is announced; stakes are
            shown as a chip (coin icon + amount, never colour alone)
  used on   S10, S11, S12

---

## Social

Moment card
  variants  photo post (2-column grid)
  sizes     radius lg, photo aspect 4:3, title overlay bottom (white 14px/600)
            over a bottom gradient scrim, view count (eye icon + count, 12px
            white), country tag chip top-left (soft chip)
  states    liked (heart filled, danger), unliked (heart outline, white)
  tokens    bg bg, border border, scrim (overlay token), text #ffffff
            on the photo, text / text-muted below it
  a11y      the card is a button; label is title + views + country (e.g.
            "Let me teach you how to sing, 116 views, Saudi Arabia")
  used on   S13

Profile header
  variants  other user (Find Me + Add Friend + Follow) and own profile
            (Edit button instead)
  sizes     cover (gradient — the clone's own subtle teal-slate gradient, or a
            user-uploaded photo, 200px tall); avatar 110px overlapping the
            cover bottom edge by 50%; Fans/Follow counts 24px/700 + 13px labels;
            name xl 28/700; badges row; meta line 13px text-muted (ID,
            country, last active — comma-separated, wraps to a second line
            on narrow widths, never middle-dot-joined); bio 14px text,
            2 lines max with a "more" disclosure
  states    own / other user
  tokens    cover gradient (room-bg-start -> room-bg-end) or user photo;
            bg bg, text / text-muted, accent (Find Me / primary buttons)
  a11y      the profile is a region; counts are labelled ("382 fans");
            the bio has a "more" disclosure; the Find Me button is a primary
            pill with a location icon (solid accent — not a pink-orange gradient)
  used on   S18, S19

Collection row
  variants  Cars, Gifts received (horizontal scroll rows)
  sizes     section title 18px/700 + "See all" link (14px accent) on the
            right; items are square cards 90px, radius lg, border, with an
            image + a count label below (12px text-muted, e.g. "x5")
  states    default; horizontal scroll with a fade at the edge
  tokens    bg bg, border border, text / text-muted, accent (See all)
  a11y      the row is a list; each item is labelled (e.g. "Rose, received 5
            times"); scrolling is by swipe or arrow buttons
  used on   S18

Chat list row (Messages inbox)
  variants  unread, read, muted
  sizes     avatar 48px left; name 16px/600 text + time 12px text-muted on the
            top row; last message 14px text-muted, 1 line, ellipsis; unread
            badge (danger bg, white text, 16px min, pill) on the right
  states    unread (name 700, badge visible), read (name 400, no badge),
            muted (muted icon next to the name)
  tokens    bg bg, border border, text / text-muted, badge danger
  a11y      the row is a button; label is name + last message + unread count
  used on   S17

Voice intro player
  variants  a card: avatar (48px) + name + play button + waveform + duration
            + "Say hi" button
  sizes     play button 44px circle (accent bg, white play icon); waveform is
            a row of bars (accent, heights vary); duration 12px text-muted
            (e.g. "0:12"); "Say hi" is a primary pill
  states    idle, playing (bars animate, pause icon), paused
  tokens    bg surface, accent (play button + waveform), text / text-muted
  a11y      the play button is labelled "Play voice intro by X"; the waveform
            is decorative; the duration is announced; the audio stops when the
            card scrolls off screen
  used on   S15, S16

---

## Commerce

Wallet pack card
  variants  coin pack, diamond pack (web recharge is a later milestone)
  sizes     card radius lg, border, bg surface; pack amount 20px/700 text +
            currency icon; price 16px/600 text (e.g. "$0.99"); "Best value"
            badge (accent-soft bg + accent text) when applicable
  states    default, selected (accent 2px border + accent-soft bg), loading
  tokens    bg surface, border border, selected accent / accent-soft,
            text / text-muted
  a11y      the card is a button (radio); label is amount + price (e.g.
            "7,000 coins, $0.99"); the selected state is announced
  used on   S20

VIP tier card
  variants  VIP 1-10 progress card; Baron / Duke subscription cards (30 days)
  sizes     tier name 20px/700; progress bar (track surface-2, fill is a
            gradient from coin #f59e0b to vip #d97706 — amber to gold, which
            reads as premium and is distinct from the flat warning orange;
            height 8, radius pill); current/total 13px text-muted (e.g.
            "2,400 / 5,000 diamonds"); perks list (icon + text, 14px);
            CTA primary ("Upgrade — 1,667 diamonds" / "Subscribe")
  states    current tier (highlighted, vip border), locked, owned
  tokens    bg bg, border border, vip (progress fill + current-tier border),
            text / text-muted
  a11y      the progress bar has a value + label ("VIP 5, 2,400 of 5,000
            diamonds"); perks are a list; the CTA names the price
  used on   S21

Mission row
  variants  daily / weekly mission row
  sizes     icon 44px (accent-soft bg, accent icon); title 16px/600 text;
            description 14px text-muted; progress ("2/3 rooms", 13px
            text-muted) + progress bar (track surface-2, fill accent, height
            6); reward (coin icon + "100", 14px/700 text); claim button
            (primary sm, "Claim")
  states    in-progress, completable (claim button enabled), claimed (success
            check, disabled)
  tokens    bg bg, border border, accent (icon bg + progress fill), success
            (claimed)
  a11y      the row is a group; progress is announced; the claim button is
            labelled with the mission name ("Claim reward for Join 3 rooms")
  used on   S26

Lucky Bag card
  variants  bag 66 / bag 99
  sizes     card radius lg; bag number 28px/700; currency icon; participants
            (avatar row, up to 6, with a "+n" disclosure); open/claim button
            (primary)
  states    open (can claim), claimed (success, disabled), expired (muted,
            "Expired")
  tokens    bg bg, border border, text / text-muted, accent (button),
            success (claimed)
  a11y      the button is labelled "Open Lucky Bag 66"; participants are
            announced as a count ("4 of 6 people have opened this bag")
  used on   S23

Event card
  variants  seasonal promo card (Gold Rush, Ramadan, Milestone, referral)
  sizes     banner card radius lg; event image (the clone's own art); title
            18px/700; dates 13px text-muted; countdown timer (14px/700,
            tabular figures); CTA ("Join" / "Claim", primary sm)
  states    active (countdown running), upcoming, ended (muted, no CTA)
  tokens    bg bg, border border, text / text-muted, accent (CTA),
            warning (countdown when under 1 hour)
  a11y      the countdown is a timer region (announced politely, not on every
            tick); the CTA is labelled with the event name
  used on   S25

Countdown / event banner
  variants  full-width banner with a countdown (days / hours / mins)
  sizes     countdown 20px/700, tabular figures so digits do not jump; title
            16px/600; CTA primary sm
  states    active, ended (muted, "Event ended")
  tokens    bg surface, text / text-muted, accent (CTA)
  a11y      the countdown is a timer region
  used on   S25

Leaderboard row
  variants  room ranking, host ranking
  sizes     rank 20px/700 text (top 3 get a medal icon — the clone's own
            medal art: gold / silver / bronze); avatar 40px; name 16px/600;
            score 16px/700 text right-aligned; change indicator (up/down
            arrow, success/danger)
  states    top-3 (medal), normal, self (highlighted, accent-soft bg)
  tokens    bg bg, border border, text / text-muted, accent-soft (self),
            success / danger (change)
  a11y      the row label is rank + name + score (e.g. "Rank 1, Natasha,
            12,400 points")
  used on   S32

Jackpot / Wheel
  variants  prize-draw wheel (Greedy / Grade Jackpot, Lucky Draw & Wheel)
  sizes     wheel (circular, the clone's own art, segments); spin button
            (primary lg); prize pool (coin icon + amount, 16px/700)
  states    idle, spinning (motion slow 400ms + spin animation), win (success
            banner + amount), lose (muted "Try again"); reduced-motion shows
            the result directly with no spin
  tokens    bg bg, accent (spin button), success (win), text / text-muted
  a11y      the spin button is labelled; the result is announced; the wheel
            itself is decorative
  used on   S24

Agency card
  variants  agency detail card
  sizes     agency name 18px/700; owner (avatar + name); member count 13px
            text-muted; settlement rate 13px text-muted; actions (Join /
            Request NOC / View settlements)
  states    member, pending, not a member
  tokens    bg bg, border border, text / text-muted, accent (actions)
  a11y      each action is labelled with the agency name
  used on   S33

---

## Auth / onboarding

Sign-in buttons
  variants  Google, Facebook, TikTok, SMS ("Continue with phone")
  sizes     full width, 48px, radius md, provider logo left + label centred
            (16px/600)
  states    default, loading (spinner + label kept)
  tokens    Google: white bg + border + dark text; Facebook: #1877f2 bg +
            white text; TikTok: #000000 bg + white text; SMS: accent bg +
            white text
  a11y      each button is labelled with the provider ("Continue with Google")
  used on   S03
  note      the provider button colours (Facebook blue, TikTok black) are
            platform conventions users recognise — they are the providers'
            own brand marks for login, not the clone adopting YoHo's colours

Profile setup form
  variants  avatar picker (circular 96px, "+" to upload), nickname input,
            gender selector (segmented control), age input (numeric), country
            picker (dropdown), bio input (multiline, 3 lines)
  sizes     fields 48px; CTA primary lg full-width ("Continue")
  states    default, error (field border danger + error text below), loading
  tokens    bg bg, border border-input, text / text-muted, danger (error)
  a11y      every field is labelled; errors are announced; the avatar picker
            is labelled "Choose a profile photo"; age enforces 13+ with an
            error message
  used on   S04

Create room form
  variants  room name input, topic tags (chip multi-select, tag tokens),
            cover picker (image), capacity stepper (- 9 +, default 9), entry
            condition (segmented: Open / Password / Invite-only), password
            input (shown only when Password is selected), theme picker (room
            theme swatches — the clone's own themes)
  sizes     fields 48px; CTA primary lg full-width ("Create room")
  states    default, error, loading
  tokens    bg bg, border border-input, text / text-muted, tag-* (topic chips)
  a11y      every field is labelled; the entry condition is a radio group;
            the password field appears only when relevant and is announced
  used on   S31

---

## Settings / safety

Settings row
  variants  navigation row (icon + label + value/chevron) or toggle row
  sizes     row 56px: icon 24px text-muted, label 16px text, value/chevron
            right text-muted; section titles 13px/600 text-muted, sentence
            case (never tracked capitals)
  states    default, pressed, toggle on/off (see Toggle)
  tokens    bg bg, border border, text / text-muted
  a11y      each row is a button or a group; navigation rows announce their
            destination
  used on   S27, S28

---

## Call

1-to-1 call controls
  variants  call screen: the other user's avatar (120px, centred) + name,
            call state, and a row of circular controls
  sizes     controls 64px circles; end-call button 72px, danger bg,
            phone-down icon, centred and larger; call timer 16px/600 tabular
            figures
  states    calling ("Calling…"), connected ("Connected 02:34"), ended
  tokens    room-bg gradient (the call screen uses the room theme), room-text,
            room-text-muted, danger (end call), accent (mute/speaker when on)
  a11y      each control is labelled ("Mute", "Speaker", "End call"); the call
            state is announced; the timer is a live region (polite, not on
            every second)
  used on   S38

---

## Design decisions (ui-ux-pro-max candidates)

Three design-system candidates were generated; Candidate A was picked.

Candidate A — Deep Teal / Dark Slate (PICKED)
  pattern   dark voice room (immersive) + light discovery screens
  style     premium, calm, focused
  colors    accent deep teal #0f766e; room gradient teal-900 -> slate-900;
            light bg white; surface slate-50
  typography Inter, 12/14/16/20/28/40
  effects   teal glow speaking halo (two rings, 1600ms pulse); subtle card
            shadow; 200ms ease
  why it wins distinct from YoHo on every signature (no vivid green, no bright
            blue, no violet-cyan room, no pink-orange CTA); accent (teal) is
            a different hue family from VIP (amber), so the accent and the
            premium badge can never be confused; contrast passes AA on all
            29 pairs; a dark room is right for voice focus and battery

Candidate B — Warm Amber / Charcoal (REJECTED)
  pattern   dark voice room + light discovery; accent amber #b45309; room
            charcoal gradient
  rejected  the accent (amber) collides with VIP gold — the primary action and
            the premium badge would be the same hue family, so a badge's
            meaning would rely on colour alone; amber is also close to YoHo's
            gold (VIP) and to Vee's own SVIP gold, a brand-confusion risk

Candidate C — Indigo / Ink (REJECTED)
  pattern   dark voice room + light discovery; accent indigo #4338ca; room
            indigo-950 -> slate-900
  rejected  indigo/violet is YoHo's signature room colour — the room would
            read as a "purple room" like YoHo (trade-dress risk: the
            signature colour plus the signature layout)

Anti-patterns (never in this design system):
- YoHo's vivid green primary, bright blue secondary, violet-cyan room
  gradient, pink-orange CTA gradient, pink/red level badges.
- A purple-to-blue gradient anywhere.
- Colour as the only signal (every badge/chip has an icon + a written label).
- Fixed heights on text containers (text must reflow, never clip).
- Invented metrics, testimonials, or demo content (the no-demo law).
- Emojis as icons (the clone uses an open icon set; its own illustrations
  and gift art are commissioned, never YoHo's).

## What needs replica-brand (not decided here)

- The final brand name, logo, and app icon (the palette above is provisional;
  replica-brand swaps the values, the token names stay).
- The final accent value (teal is the provisional placeholder; the brand
  step may change it — the contrast check must be re-run after any change).
- The final room-theme gradient values (same rule).
- The clone's own gift art, car art, entrance-effect art, avatar frames,
  banner art, and illustrations (commissioned — the slots are specced here,
  the art is not YoHo's).
- The final topic-tag hues (the soft-chip pattern stays; the brand step may
  adjust the four hues as long as they stay distinct and pass AA).
- The final font pairing (Inter is the provisional open font; the brand step
  may pick another open font with the same job).

## What was NOT built (deferred to replica-build)

- Step 4 of replica-design (build the primitives in code, in isolation, and
  screenshot them) is deferred: this task is design tokens + specs only, no
  building. The primitives are built in replica-build, from these specs.
- No screen was built or restyled. No Vee, test-app, or SVIP-page file was
  touched.
- The design system is a CANDIDATE (ui-ux-pro-max output contract): pattern
  + style + colours + typography + effects + anti-patterns + the adapted
  pre-delivery checklist, awaiting his pick. Never "shipped".
