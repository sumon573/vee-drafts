# Recon map: YoHo — Group Voice Chat Room (Android)

Scope: **Full clone — the whole app, nothing left out.** Android first (package `com.voicechat.live.group`); iOS noted where it differs.
For: Sumon / Vee — a full YoHo clone to see, built clean-room style (functionality and UX patterns only; no YoHo code, assets, logos, trademarks, copy or user data).
Date: 2026-11-05
Method: replica-recon (replica-skill). Public sources only — no login, no paywall, no scraping, no decompile, no network capture.

## App identity (verified)

| field | value |
| --- | --- |
| App | YoHo: Group Voice Chat Room |
| Package (Android) | `com.voicechat.live.group` |
| Developer (Play) | YoHo Studio |
| Company (Play) | Mico World Limited, Rm 701 7/F Hong Kong Science Park PH3 Bldg 22E, Pak Shek Kok, Shatin, Hong Kong; +852 6317 3194 |
| Seller (iOS App Store) | MOBILE ALPHA LIMITED (different legal entity from Android) |
| Support email | cs@yoho.media |
| Website | https://www.yoho.media (web recharge at m.yoho.media) |
| On Play since | December 2018 |
| Latest Android version | 5.49.10 (26 Oct 2026); 5.49.00 (21 Oct), 5.48.40 (8 Oct), 5.48.30 (22 Sep), 5.48.20 (18 Sep) |
| Latest iOS version | 5.49.20 (2 days before 2026-11-05), 198.2 MB, iOS 15.0+ |
| Android size / req | 78.1 MB APK, Android 7.0+ (7.1+ + 126 MB storage for the full premium voice-filter suite) |
| Rating / installs | 4.1 stars, ~96,860 ratings; 27M installs total, ~370K in last 30 days (~12K/day); Play lists 10M+ |
| Ads | None |
| Top charts | #13–14 Top Grossing Social (Saudi Arabia / Turkey); #40–41 Overall Top Grossing (Saudi Arabia / Turkey); #18 Social Top Grossing (Germany) |
| Permissions | 59–62 (microphone, network, storage, …); 73 libraries |
| Content rating | Medium maturity (12+) |
| iOS restricted countries | China, Lithuania, Bulgaria, Croatia, Turkey, Nigeria, South Korea, Cote D'Ivoire, Afghanistan, Macedonia |
| Sister apps (same studio) | YoHo Lite (Google Play), Yoho TV—Drama & Chat, Saya Lite - Games&Party&Chat |

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Google Play listing | https://play.google.com/store/apps/details?id=com.voicechat.live.group&hl=en_US | full description, 6 screenshots, rating 4.08 (97,765), "Voice Chat Room, Play Games with Friends, Ludo & Dominos" |
| 2 | AppBrain | https://www.appbrain.com/app/yoho-group-voice-chat-room/com.voicechat.live.group | installs, versions, rankings, rating histogram (72K 5★ / 17K 1★), user comments |
| 3 | Official site | https://www.yoho.media | landing page; sections: Various Live, Voice Live Streaming, Find New Friends; site images home.png / room.png / profile.png |
| 4 | APKPure | https://apkpure.com/yoho-group-voice-chat-room-app/com.voicechat.live.group | feature write-up + 5-step "how to use" guide |
| 5 | BitTopup news — 2026 privacy updates | https://news.BITTOPUP.com/news/yoho-voice-chat-2026-updates-buy-coins-now-or-wait | versions 5.39.50–5.40.50, 2FA, purchase verification, room privacy, coin bundles |
| 6 | BitTopup news — top-up guide (coins vs diamonds) | https://news.bittopup.com/news/yoho-top-up-guide-2026-diamonds-coins-best-value | two-currency system, gift prices, VIP costs, intimacy ratios |
| 7 | BitTopup news — coins price guide | https://news.bittopup.com/news/yoho-coins-price-guide-2026-save-up-to-30-on-top-ups | full coin package price table, web vs in-app rates |
| 8 | BitTopup news — free coins guide | https://news.bittopup.com/news/yoho-group-voice-chat-free-coins-2026-every-confirmed-earning-method-after-the-april-update | daily missions, login streak, hosting rewards, referral |
| 9 | BitTopup news — AI voice effects | https://news.BITTOPUP.com/news/yoho-ai-voice-effects-2026-activation-coins-guide | 7 premium filters, exact activation steps (long-press mic) |
| 10 | BitTopup news — premium voice rooms | https://news.BITTOPUP.com/news/yoho-premium-voice-rooms-2026-how-to-unlock-them | room access tiers, host controls |
| 11 | VGTopup | https://vgtopup.com/top-up/yoho | coin packages in USD; Coins vs Beans definitions |
| 12 | iOS App Store | https://apps.apple.com/us/app/yoho-group-voice-chat/id1509635224 | iOS version, size, seller, topic tags (music, chatting, Karaoke, Truth or Dare) |
| 13 | APKBA install test | https://www.apkba.com/yoho-group-voice-chat-room/com.voicechat.live.group | sign-in screen observed on video: Google / Facebook / TikTok buttons, New User registration, "Can't login?" |
| 14 | Play Store user reviews (via search + AppBrain) | Play listing (see #1) | voice quality, earning, Lucky Bag, agency/NOC, jackpot, Chinese-language complaints |
| 15 | BlueStacks page (video) | https://www.bluestacks.com/apps/social/yoho-a-new-beginning-on-pc.html | "How To Tuts" 3:36 walkthrough video (YouTube Vhqyimc_RE4) — not watched, listed for follow-up |

Reference screenshots saved in `screens/` (public store/site images only, never to ship):
`play-feature-graphic.jpg`, `play-voice-chat-party.jpg`, `play-moments.jpg`, `play-ludo.jpg`, `play-dominoes.jpg`, `play-activity-rooms.jpg`, `site-home.png`, `site-room.png`, `site-profile.png`.

## Core loop

Join a live group voice room in one tap, talk and play games on mic seats while the room chats and gifts flow; hosts earn Beans from gifts and level up, listeners spend Coins/Diamonds on gifts, VIP and filters to stand out — and come back daily for login + missions.

## Screens

`seen` = confirmed from a screenshot or an explicit source. `inferred` = named in text but no screenshot seen. `gap` = must be captured from a phone.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Splash / launch | app start | brand + load | logo, loading | inferred |
| S02 | Language selection | first launch | pick language | language list, English option | inferred (APKBA video: English selection on opening page) |
| S03 | Sign-in / Login | first launch, logged out | authenticate | Google / Facebook / TikTok buttons, SMS ("message") sign-in, New User registration prompt, "Can't login?" link | seen (APKBA install-test video description) |
| S04 | Profile setup | after sign-up | basic profile so people recognise you | avatar, nickname, basic fields | inferred (APKPure guide step 1) |
| S05 | Home — room discovery | bottom nav Home | find a live room | Hot / Related tabs (green dot on Hot), banner carousel ("SUPER VOICE", 3 dots), 2-col room cards (cover photo, topic tag: Chat/Sing/Dating/Party, live icon + listener count, room name), create-room icon (house+) top-right | seen (site-home.png) |
| S06 | Activity rooms | Home / discovery | themed event rooms | cards: title ("Akilah is holding birthday party", "Abass is sharing investment strategy"), cover image, "users online", green Join button, "The most interesting topics" card | seen (play-activity-rooms.jpg) |
| S07 | Voice room | tap a room card / Join | group voice chat | room title + ID, diamond value chip (e.g. 3068), online count (e.g. 36), "…" menu, exit/power icon, host avatar (large, pulsing rings) + name, 8 mic seats (2 rows × 4, or circle layout), chat messages with avatar + level badges, music/disc icon, bottom bar: chat input "Hi…", emoji, gift (purple gift box), speaker, mic, grid/more, Record button, "840K" counter, level badge | seen (site-room.png, play-voice-chat-party.jpg) |
| S08 | Room settings / privacy | room "…" menu / host controls | host manages the room | capacity, entry conditions (open / password / invite-only), mic seat rules, who can join / listen / interact, premium-room controls | inferred (BitTopup privacy article + room settings) |
| S09 | Audio settings / Voice filters | in room: claim mic seat → long-press mic icon | voice effects on mic feed | Voice Filters panel, Premium 2026 category tabs, 7 filters (incl. Anime Voice, Crystal Clear HD, Echo & Reverb, Nature Ambience Layer in soundscape sub-menu), 5-sec preview on tap, Activate (7,000 coins), intensity slider | inferred (BitTopup AI voice effects guide, exact steps) |
| S10 | Game in room — Ludo | room → game | play Ludo while chatting | 4-colour board, dice, tokens, player avatars, chat bubbles over board, "Onlookers" label, room chat bar stays visible | seen (play-ludo.jpg) |
| S11 | Game in room — Dominoes | room → game | play Dominoes while chatting | green table, domino tiles, dice, flying gold coins, trophy "1", onlookers, room chat bar | seen (play-dominoes.jpg) |
| S12 | Game in room — Uno / fishing / Parcheesi | room → game | other in-room games | named in Play description + guides; arcade fishing game named | inferred (no screenshot seen) — gap |
| S13 | Moments feed | bottom nav Moments | social feed of user posts | Related / Hot tabs, search + bell icons, post cards (photo, title e.g. "Let me teach you how to sing!", "Saudi Arabia VS Japan", views 116, country tags KSA / Egypt), green floating Chat button, Ludo promo card ("LUDO 1 ON 1, 724 players, Start Now") | seen (play-moments.jpg) |
| S14 | Moment detail | tap a Moment card | view one post, like/comment | post photo/text, like + view counts, author | inferred — gap |
| S15 | Private chat discovery (voice intros) | Messages / discovery | meet 1-to-1 | randomly generated list of suggested users, voice-intro recordings, tap an icon → listen → "say hi" | inferred (Play description + APKPure) — gap |
| S16 | Private chat (1-to-1) | tap a suggested user / Messages | text + voice DM | text bubbles, voice messages (record), gift | inferred — gap |
| S17 | Messages / Inbox | bottom nav Messages | conversation list | chat list, unread badge (20 seen in one screenshot), chat bubble icon | seen (play-moments.jpg bottom nav) — detail gap |
| S18 | Profile (other user) | tap avatar anywhere | who this person is | gradient cover, avatar, Fans 382 / Follow 330, name, badges (age/level/charm e.g. 18 / 89 / 199), ID + country + last active ("3 mins ago"), bio, "Find Me" button, Album photo strip, Cars collection (sports cars), Gifts received with counts (rose x5, clover x30, watermelon x29, cake x9), Add Friend (green) + Follow (blue) buttons | seen (site-profile.png) |
| S19 | Me / My profile | bottom nav Me / account icon top-right | own account | avatar, nickname, YoHo ID (Profile → Server Name → Gravity icon → Copy ID), level, VIP, coins/diamonds/beans balances, Mission Board, Events, Settings | inferred (BitTopup ID-copy steps + Me menu refs) — gap |
| S20 | Wallet / Recharge | Me → Wallet / Recharge, or yoho.media Recharge | buy Coins / Diamonds | coin packs (7,000 / 35,000 / 70,500 / 353,000 / 708,000), diamond packs, web recharge (m.yoho.media), payment methods, purchase caps/holds notices | inferred (price tables + recharge links) — gap |
| S21 | VIP / Membership | Me → VIP | tiers + subscriptions | VIP 1–10 progress, Baron (1,000–3,000 diamonds/30d), Duke (30,000–60,000 diamonds/30d), entrance effects, avatar frames, chat bubbles, mic halos, priority support | inferred (BitTopup VIP tables) — gap |
| S22 | Gift panel / gift store | room gift button / chat gift button | send a virtual gift | gift grid (localized + themed), prices in coins/diamonds, gift animation on send, intimacy points | inferred — gap (gift art itself is YoHo-owned; clone needs its own art) |
| S23 | Lucky Bag | in room / events | shared prize bag | bag (66 / 99), open with 6 people, claim flow, fairness complaints (iOS vs Android) | inferred (reviews) — gap |
| S24 | Jackpot / Lucky Draw / Wheel | room / events | prize mini-games | Greedy/Grade Jackpot, Lucky Draw & Wheel with coin prize pools + avatar items | inferred (reviews + guides) — gap |
| S25 | Events | Home → Events; Me → Events → Seasonal | seasonal promos | Gold Rush (1.5x coins 7–9 PM), Ramadan (70% diamond discount), Milestone Recharge Event, Spring referral; event banners + claim deadlines | inferred (BitTopup event calendar) — gap |
| S26 | Mission Board | Me → Mission Board / Home daily-task panel | daily + weekly tasks | daily login streak, missions (host 30+ min 150, join 3+ rooms 100, send gifts 75, update profile 50), 375 coins/full set, reset UTC 00:00, claim buttons | inferred (BitTopup mission tables) — gap |
| S27 | Settings | Me → Settings | app settings | Account Security, privacy, notifications, language, about, logout | inferred — gap |
| S28 | Account Security / 2FA | Me → Settings → Account Security | secure account | Enable 2FA, verification prompts, purchase verification status | inferred (BitTopup 2FA steps) — gap |
| S29 | Notifications | bell icon (Moments top bar) | alerts | notification list (gifts, follows, room invites, system) | inferred — gap |
| S30 | Search | search icon (Moments top bar) | find rooms/users | search field, results (rooms + users) | inferred — gap |
| S31 | Create room | Home create icon / center + button | start your own room | room name, topic tags (music, chatting, Karaoke, Truth or Dare, …), cover, capacity, entry conditions, theme | inferred (iOS tags + create flow) — gap |
| S32 | Room rankings / Leaderboard | Home / Me | top rooms + hosts | ranked room list, broadcaster ranking, scores, period filters | inferred (guides mention room rankings) — gap |
| S33 | Agency | (host flow) | host management + settlement | agency membership, agency owner, NOC to switch agency, host settlement, earnings targets | inferred (reviews: agency owner, NOC, earnings) — gap |
| S34 | Fans / Following lists | profile → Fans / Follow counts | social graph | user rows, follow/unfollow | inferred — gap |
| S35 | Album / photo viewer | profile → Album | user photos | photo grid, full-screen viewer | inferred (site-profile.png Album strip) — gap |
| S36 | Customer service / Help | Me → Help / in-app CS | support | 24×7 online customer service, in-app support bot, email cs@yoho.media | inferred (Play replies + reviews) — gap |
| S37 | Referral | Me / Events | invite friends | referral link/share, new-user qualifying actions, bonuses for both sides | inferred (Spring referral program) — gap |
| S38 | 1-to-1 call | private chat / profile | voice call | call screen, mute option (removed in a 2026 update per review), call states | inferred (review: "removal of the mute option and calls not going through") — gap |

## Flows

```
F01 Sign up
    S02 language -> S03 sign-in (SMS / Facebook / Google / TikTok) -> S04 profile setup -> S05 Home
    happy path clicks: 4-6
    edge: "Can't login?" recovery; SMS code failure; under-30-day account limits

F02 Discover + join a room (core loop)
    S05 Home (Hot/Related, banner, room cards) -> S07 voice room -> listen -> take mic seat -> chat / gift
    happy path clicks: 2 (tap card, tap seat)
    edge: room full; password/invite-only room; mic permission denied; room ended

F03 Create + host a room
    S05 Home create icon -> S31 create room (name, topic tags, capacity, entry) -> S07 room (host seat) -> manage seats / settings (S08) -> end room
    happy path clicks: ~5
    edge: capacity reached; entry-condition change mid-room; host leaves (room closes or transfers)

F04 Play a game in a room
    S07 voice room -> game picker -> S10 Ludo / S11 Dominoes / S12 Uno / fishing / Parcheesi -> play -> result / trophy
    happy path clicks: 2-3
    edge: game stakes (coins); not enough players; spectator ("Onlookers") mode

F05 Send a gift
    S07 room (or S16 private chat) -> gift button -> S22 gift panel -> pick gift -> pay Coins/Diamonds -> animation + intimacy points
    happy path clicks: 3
    edge: insufficient balance -> S20 Recharge; gift is diamond-only; daily purchase caps

F06 Private chat via voice intro
    S15 discovery list -> listen to voice intro -> tap icon -> "say hi" -> S16 private chat (text + voice messages)
    happy path clicks: 3
    edge: user does not reply; block/report; voice recording permission

F07 Top up (Recharge)
    S20 Wallet/Recharge (or m.yoho.media web) -> pick pack -> pay (Play / App Store / web) -> Coins/Diamonds credited to account ID
    happy path clicks: 3
    edge: >$50 review hold (7-14 days); daily diamond cap 10,000; max 3 purchase attempts/24h; under-90-day / under-5-transaction accounts held; new accounts 6,250-coin per-transaction cap

F08 Unlock a premium voice filter
    S07 room -> claim mic seat -> long-press mic icon -> S09 Audio Settings -> Voice Filters -> Premium 2026 -> select filter -> 5-sec preview -> Activate -> confirm 7,000 coins -> intensity slider
    happy path clicks: 6
    edge: not on a mic seat (activation blocked); Android 7.0 without full suite; filter in soundscape sub-menu (Nature Ambience Layer) easy to miss

F09 Daily missions + login streak
    S26 Mission Board (Me > Mission Board / Home panel) -> do tasks (host 30+ min, join 3+ rooms, send gift, update profile) -> claim coins; daily login streak
    happy path clicks: 1-4
    edge: missions reset UTC 00:00 sharp; missed day lost; hosting must register 30 consecutive minutes

F10 Open a Lucky Bag
    S07 room / event -> S23 Lucky Bag (66 / 99) -> 6 people open -> claim
    happy path clicks: 2
    edge: bag fails to open on some devices (review); fairness complaints (iOS vs Android claim rates)

F11 Become VIP
    spend Coins/Diamonds on gifts -> growth points -> S21 VIP tiers (VIP 1-10; seasonal VIP10 1,667 diamonds in S1/S5/S9 vs 10,000 standard) -> perks (entrance effects, frames, halos, priority support)
    edge: VIP30 150,000 lifetime diamonds; VIP60 5,000,000; Baron/Duke are separate 30-day subscriptions

F12 Follow + find friends
    S05 Home / S13 Moments -> S18 profile -> Follow / Add Friend -> S34 fans/following; "Find Me" button on profile
    happy path clicks: 2

F13 Post a Moment
    S13 Moments -> create -> photo + text -> publish -> appears in Related/Hot feed with views/likes
    edge: photo permission; moderation

F14 Earn as a host (Beans)
    host room (F03) -> receive gifts -> earn Beans -> S33 agency settlement -> convert Beans to cash or exchange for coins
    edge: agency owner / NOC required to switch agency; earnings targets; call-feature changes affecting livelihood (review)

F15 Join an agency
    S33 agency -> apply/join -> host under agency -> settlement via agency
    edge: stuck under inactive agency owner who refuses NOC (review complaint); no official in-app info on how to create/own an agency
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Bottom nav | Home, Moments, center Create (+), Messages, Me | active/inactive, badge count | S05, S13, S17, S19 (Moments screenshot shows 5 tabs; site-home mockup shows 3) |
| Room card | cover photo, topic tag (Chat/Sing/Dating/Party), listener count | live, full, ended | S05 |
| Banner carousel | promo banner ("SUPER VOICE") | auto-scroll, dots | S05 |
| Tabs | Hot / Related | selected (green dot) / unselected | S05, S13 |
| Mic seat | host (large, pulsing rings) / guest / empty (+) / locked | speaking (halo), muted, empty, locked | S07 |
| Chat message row | text, gift, system | with avatar + level badge, without | S07, S16 |
| Chat input bar | text field "Hi…", emoji, gift, speaker, mic, grid/more | focused, typing, muted | S07 |
| Gift panel | grid of gifts, price chips | selected, insufficient balance | S07, S16, S22 |
| Gift animation | full-screen effect (car, airship, dragon…) | playing | S07 |
| Avatar frame | crown, VIP glow, event frame | — | S07, S18, S19 |
| Level / charm badge | numeric chip (e.g. 90, 100, 199) | — | S07, S18 |
| Entrance effect | car / airship / mythical creature animation | on join | S07, S21 |
| Voice filter picker | filter list, Premium 2026 tabs, intensity slider, preview | locked / owned / active | S09 |
| Game board | Ludo / Dominoes / Uno / fishing | playing, waiting, finished, spectator | S10–S12 |
| Moment card | photo, title, views, country tag | liked, unliked | S13 |
| Profile header | cover, avatar, Fans/Follow counts, badges, ID/country/last-active, bio | own / other user | S18, S19 |
| Collection row | Cars, Gifts received (with x-counts) | horizontal scroll | S18 |
| Buttons | primary (green Add Friend / blue Follow), Join (green), Find Me (gradient), Recharge | default, disabled, loading | all |
| Toast / modal sheet | confirm purchase, error, hold notice | — | S20, S22 |
| Countdown / event banner | Gold Rush, Ramadan, Milestone | active, ended | S25 |
| Leaderboard row | rank, avatar, name, score | — | S32 |

## Inferred data model

```
User  id (numeric YoHo ID, e.g. 23503486), nickname, avatar, gender, age, country,
      bio, level, charm, vip_level (0-10), vip_season, coins, diamonds, beans,
      fans_count, follow_count, last_active_at, server_name, agency_id,
      voice_intro_url, is_host, created_at
      evidence: S18 profile, S19 Me, BitTopup ID-copy steps, reviews
      confidence: high

Room  id (numeric, e.g. 362380), title, cover_image, topic_tags[], host_id,
      capacity, entry_type (open | password | invite-only), theme,
      online_count, diamond_value, status (live | ended), created_at
      evidence: S05 cards, S06 activity rooms, S07 header, S08 settings
      confidence: high

MicSeat  room_id, seat_index (1-8 + host), user_id, state (empty | speaking | muted | locked),
         halo_vip_level
         evidence: S07 (8 seats + host), S09 (claim seat to activate filter)
         confidence: high

RoomMessage  id, room_id, sender_id, text, type (text | gift | system), sent_at
             evidence: S07 chat
             confidence: high

Gift  id, name, price_coins, price_diamonds, category, animation, localized (country)
      evidence: S22, gift price lists (Aurora Borealis 4,500 diamonds; Standard Castle 5,000;
      Gala Dragon 9,999; Love Carriage 29,999)
      confidence: high

GiftSend  id, sender_id, receiver_id, room_id, gift_id, count, intimacy_points, created_at
          evidence: S07 gifting, intimacy ratios (500-coin gift = 200 intimacy)
          confidence: medium

GameSession  id, room_id, game_type (ludo | uno | dominoes | fishing | parcheesi),
             players[], state (waiting | playing | finished), stakes_coins, winner_id
             evidence: S10-S12, VGTopup (room stakes)
             confidence: medium

Moment  id, author_id, photos[], text, likes, views, country_tag, created_at
        evidence: S13 feed
        confidence: high

PrivateChat  id, user_a, user_b, last_message_at
ChatMessage  id, chat_id, sender_id, type (text | voice), content, sent_at
             evidence: S15-S16 (voice intros, voice messages)
             confidence: medium

VoiceIntro  user_id, audio_url, duration
            evidence: S15
            confidence: medium

Follow  follower_id, following_id, created_at
        evidence: S18 (Fans/Follow), S34
        confidence: high

WalletTransaction  id, user_id, type (purchase | gift | earn | settlement | mission),
                   currency (coins | diamonds | beans), amount, created_at
                   evidence: S20, purchase caps/holds, mission rewards
                   confidence: medium

VIPSubscription  user_id, tier (vip1-10 | baron | duke), diamonds_spent, expires_at, season
                 evidence: S21, BitTopup VIP tables
                 confidence: medium

Mission  id, type, reward_coins, period (daily | weekly)
MissionProgress  user_id, mission_id, done, claimed_at, reset_at (UTC 00:00)
                 evidence: S26, mission tables (host 150 / join 100 / gift 75 / profile 50)
                 confidence: medium

Event  id, name, type (gold_rush | ramadan | milestone | referral | seasonal),
       starts_at, ends_at, multiplier, discount_pct
       evidence: S25, BitTopup event calendar
       confidence: medium

LuckyBag  id, room_id, bag_number (66 | 99), participants[], claimed_by, created_at
          evidence: S23, reviews
          confidence: low (bag numbers + 6-person open from reviews only)

Agency  id, name, owner_id, members[], settlement_rate
        evidence: S33, reviews (agency owner, NOC, earnings targets)
        confidence: low (no official in-app documentation found)

RoomRanking  room_id, rank, score, period
             evidence: S32, guides (room rankings)
             confidence: low

Notification  id, user_id, type, title, body, read, created_at
              evidence: S29 bell icon
              confidence: medium
```

Relationships: User 1-n Room (hosted); Room 1-n MicSeat; Room 1-n RoomMessage; User 1-n GiftSend; User 1-n Moment; User n-n Follow; User 1-n WalletTransaction; User 1-1 VIPSubscription; User n-n Mission (via MissionProgress); Room 1-n GameSession; Room 1-n LuckyBag; User n-1 Agency; Room 1-1 RoomRanking.

## Monetization (verified from public price tables)

Two currencies, no conversion between them. Coins do not expire.

**YoHo Coins** — mid-tier: virtual gifts, voice filters, room effects, mid-tier avatar items.
| Pack | Web (S$) | In-app (US$) | Discount |
| --- | --- | --- | --- |
| 7,000 | 1.07–1.14 | 0.99 | 10–15% |
| 35,000 | 5.55 | 4.99 | 13–15% |
| 70,500 | 9.97–11.14 | 9.99 | 18–22% |
| 353,000 | 49.49–55.73 | — | 20–23% |
| 708,000 | 99.60–111.46 | 99.99 | 22–23% |
Third-party top-up (VGTopup, USD): 20,000 $1.83; 35,000 $3.20; 70,500 $6.45; 353,000 $32.31; 708,000 $64.81. 7,000 coins permanently unlocks all 7 premium voice filters — the best-value single purchase.

**YoHo Diamonds** — high-value: high-value gifts, VIP tiers, subscriptions. Web ~$1.96 per 100 diamonds; in-app ~$3.14 per 100 (40–60% gap). High-value gifts: Aurora Borealis 4,500; Standard Castle 5,000; Gala Dragon 9,999; Love Carriage 29,999.

**YoHo Beans** — earned by hosts/broadcasters from received gifts; convertible to cash or exchangeable for coins via host/agency settlement. Coins are non-withdrawable.

**VIP / subscriptions**
| Tier | Cost |
| --- | --- |
| VIP 1–10 | spend-based growth points; VIP10 10,000 diamonds standard, 1,667 in S1/S5/S9 seasons |
| VIP30 | 150,000 lifetime diamonds |
| VIP60 | 5,000,000 lifetime diamonds |
| Baron | 1,000–3,000 diamonds / 30 days (~$19.60–$58.80) |
| Duke | 30,000–60,000 diamonds / 30 days (~$588–$1,176) |
Perks: custom entrance effects (sports cars, flying airships, mythical creatures), avatar frames, chat bubbles, mic halo effects, priority customer support, VIP4–6 36-hour streak protection, VIP7–10 20-min premium cooldown reduction.

**Purchase rules (2026):** daily diamond cap 10,000; max 3 purchase attempts / 24h; purchases > $50 trigger 7–14 day review holds; accounts < 90 days old or < 5 prior transactions face extra holds; new accounts (< 30 days) 6,250-coin per-transaction cap + 15-min gaps.

**Free earning:** ~40,500 coins/month (daily login ~29,250 + missions ~11,250); up to 65,000–90,000 with full engagement. Daily missions 375 coins/full set. Events: Gold Rush 1.5x coins (7–9 PM), Ramadan 70% diamond discount, Milestone Recharge Event, Spring referral program.

**Intimacy:** 500-coin gift = 200 intimacy (0.40/coin, best ratio); 200-coin ≈ 50 (0.25); 1,000-coin ≈ 150 (0.15).

## Permissions / technical

- 59–62 permissions (microphone, network, storage, …), 73 libraries (AppBrain).
- Voice filters run on-device (not server-side); full suite needs Android 7.1+ and 126 MB storage.
- Voice room audio: "advanced voice system" (marketing); 2026 updates add end-to-end voice encryption claims, room privacy controls, anonymous mode.
- 2FA via Me → Settings → Account Security.
- YoHo ID is the top-up key: account icon (top-right) → Profile → Server Name → Gravity icon → Copy ID.

## Feature matrix

See `features.csv`. Must: 57, should: 53, could: 18, skip: 8. Total rows: 136.

## Out of scope (cannot or should not be cloned)

- YoHo's user network and 27M users, its live rooms and communities (a clone starts empty).
- YoHo's brand, name, logo, app icon, marketing copy and store screenshots.
- YoHo's gift art, car art, entrance-effect art, avatar frames and other owned visual assets — the clone needs its own art in the same slots.
- The music catalogue / any licensed audio.
- Google Play / App Store billing and third-party top-up platforms (VGTopup, BitTopup) — the clone needs its own payment path.
- The agency/creator network and its settlement deals.
- Exact Lucky Bag / Jackpot odds and anti-fraud rules (proprietary, unpublished).
- YoHo Lite (separate lighter app — clone the main app first; Lite is a rescope).
- User data, chat history, gift history, balances of real users.

## Size

Screens 38, flows 15, entities 18. Hard parts: realtime group voice (multi-seat, low latency), in-room games with live sync (Ludo/Uno/Dominoes/fishing), the three-currency economy + host cash-out settlement, VIP/subscription gating, on-device AI voice filters, agency + rankings systems, scale (27M-user class). Size: **XL** for the full clone as mapped — rescope advised. Core loop alone (voice rooms + seats + chat + gifts + sign-up + wallet) is **L**.

## Gaps — what only the boss's phone can fill

These screens/flows could not be verified from public sources. Exact phone screenshots that would close each gap (install YoHo from Play, sign in with his own account, screenshot each):

1. **S01 Splash + S02 language + S03 sign-in** — launch screens, sign-in options as they appear on his phone (Google/Facebook/TikTok/SMS), New User flow.
2. **S04 profile setup** — fields shown after first sign-up.
3. **S05 Home (live)** — real room cards, banner carousel slides, Events entry, current tab layout (5-tab vs 3-tab nav).
4. **S07 voice room (live)** — full room UI: seat layout, Record button, "840K" counter meaning, gift button, mic/speaker states, room "..." menu contents.
5. **S08 room settings / privacy** — every toggle and option (capacity, entry conditions, mic seat rules, who can join/listen/interact).
6. **S09 voice filters panel** — the 7 filter names, Premium 2026 tabs, intensity slider, preview, price confirmation.
7. **S12 Uno / fishing / Parcheesi** — in-room game screens (only Ludo + Dominoes have public screenshots).
8. **S13 Moments (live) + S14 moment detail** — real feed, post detail, like/comment UI.
9. **S15 voice-intro discovery + S16 private chat** — suggested-user list, voice intro player, 1-to-1 chat UI, voice message recording.
10. **S17 Messages inbox** — conversation list, unread states.
11. **S19 Me + S20 Wallet/Recharge** — own profile, balance display, coin/diamond pack list and prices as shown in-app.
12. **S21 VIP screen** — VIP progress bar, tier list, Baron/Duke cards, perk list.
13. **S22 gift panel** — full gift grid with names + prices (art itself is YoHo-owned — capture layout/prices only, not the art).
14. **S23 Lucky Bag + S24 Jackpot/Wheel** — bag UI, jackpot UI, claim flow.
15. **S25 Events + S26 Mission Board** — event list, mission list with rewards and claim buttons.
16. **S27 Settings + S28 Account Security / 2FA** — every settings row, 2FA flow.
17. **S31 create room** — every field (name, topic tags, cover, capacity, entry conditions).
18. **S32 rankings / leaderboard** — room + host ranking screens.
19. **S33 agency** — agency screen, join flow, settlement/earnings screen (if visible without joining).
20. **S38 1-to-1 call** — call screen, mute/controls.
21. **Walkthrough video** — "How To Tuts" 3:36 YoHo video (YouTube Vhqyimc_RE4, linked from the BlueStacks page) — watch for real click-by-click flows.

Note: no YoHo help center / public docs site was found (support is in-app bot + cs@yoho.media only), so there is no official feature list to cross-check against — the phone screenshots above are the only way to verify the gap screens.
