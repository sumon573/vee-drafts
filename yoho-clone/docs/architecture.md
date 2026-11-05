# Architecture: YoHo clone (a rebuild of YoHo's core features)

Scope: **Full clone — all 136 features from `features.csv` (57 must / 53 should / 18 could), nothing left out.** The 8 `skip` rows are excluded by design (YoHo's network, brand, owned art, licensed music, payment rails, agency network, exact unpublished odds, YoHo Lite) and replaced by the clone's own equivalents. Android first (package is the clone's own — never YoHo's `com.voicechat.live.group`); iOS follows the same API.
For: Sumon / Vee — a full YoHo clone to see, built clean-room style (functionality and UX patterns only; no YoHo code, assets, logos, trademarks, copy or user data).
Date: 2026-11-05. Method: replica-architect (replica-skill), from `recon.md` + `features.csv`.

## Gap-fill (done from public sources — no phone screenshots used)

The recon listed 21 gaps. These are now closed or marked from public sources only:

- **S09 voice filters — CONFIRMED.** All 7 names (community-confirmed, not developer-announced): Crystal Clear HD Enhancement, Echo & Reverb Enhancement, Deep Bass Transformer, Robot Voice Modifier, Anime Voice Filter, Chipmunk Pitch-Up Filter, Nature Ambience Layer (soundscape sub-menu). One payment of **7,000 coins unlocks all 7 permanently** (not per-filter). Activation: claim mic seat → long-press mic icon → Audio Settings → Voice Filters → Premium 2026 → select → confirm → intensity slider. Requires Android 7.1+ / 126 MB for the full suite. Sources: BitTopup 2026 filter guides (several, agreeing).
- **S03 sign-in — CONFIRMED.** Opening page: English selection, New User registration prompt, Google / Facebook / TikTok buttons, "Can't login?" link; Google verification can show reCAPTCHA + "Try another way". SMS ("message") sign-up also listed. Source: APKBA install test (Samsung SM-S911U1, Android 16, v5.48.40).
- **S12 games — CONFIRMED (types).** Ludo, Uno, Dominoes, arcade fishing (Play listing + APKBA). Parcheesi named in the Play description. No public screenshots of Uno / fishing / Parcheesi, but the game types are confirmed — the architecture models games generically (`game_type` enum), so no screenshot is needed to design the schema/API.
- **S23 Lucky Bag — CONFIRMED (mechanics + controversy).** Bags are 66-coin and 99-coin shared prizes; several people open/claim one bag. Community tracking (~1,500+ Android pulls) shows rare-tier hit rates fell ~4.2% → 2.7% after the 5.44.5 update (8 Jun 2026), and a 19 May 2026 Play review complains iOS claims bags more easily than Android. Exact odds are proprietary/unpublished. **The clone must use ONE server-side odds table for all platforms** — never reproduce the iOS/Android disparity (a fairness bug, not a feature).
- **S24 Jackpot / Wheel — LOW confidence, modelled generically.** "Lucky Draw & Wheel with coin prize pools + avatar items" (guides). A Bitcointalk "jackpot wheel" explainer found in search is a **different app** (a crash/bust-multiplier gambling game) and was NOT imported. The clone's Jackpot/Wheel is a server-run prize draw with a coin pool + avatar items; odds are server-configurable and unpublished by design.
- **S33 agency — CONFIRMED (NOC mechanism).** A host under an agency needs the agency owner's **NOC (No Objection Certificate)** to switch agencies; AppBrain reviews confirm support does not intervene when an owner refuses / goes inactive. Settlement rate is unpublished. **The clone fixes the "stuck under inactive owner" trap by design:** an NOC auto-grants after N days of owner inactivity (configurable, default 14) — a deliberate improvement, not a YoHo behaviour.
- **S38 1-to-1 call — CONFIRMED (mute removal).** A 2026 update removed the mute option and calls sometimes fail to go through; hosts report calls are a livelihood/target feature. Call screen layout itself is inferred.
- **S05/S07/S13/S22/S25/S26 price + reward tables — CONFIRMED.** Coin packs, diamond rates, high-value gifts (Aurora Borealis 4,500 / Castle 5,000 / Gala Dragon 9,999 / Love Carriage 29,999 diamonds), VIP/Baron/Duke costs, purchase rules, mission rewards (375 coins/full set), event names — all from BitTopup price/event guides (see recon.md).
- **Gap 21 walkthrough video — CORRECTED (dead end).** YouTube `Vhqyimc_RE4` ("How To Tuts", 3:36) is **a BlueStacks promo** ("How to download apps on your PC and Mac with BlueStacks"), not a YoHo walkthrough. It shows nothing of YoHo's flows. There is no public click-by-click YoHo video; the flows in this document are therefore derived from the written guides + screenshots, and each flow's confidence is noted in the API table.

Still unverified (inferred, confidence noted): exact screen layouts for S04, S08, S14–S17, S19–S21, S25–S32, S34–S37 (toggle lists, field lists, grid layouts); the "840K" counter in the room header (inferred: room heat/popularity score); the exact room-ranking formula; the agency settlement rate; the exact Lucky Bag / Jackpot odds. All of these are **server-configurable** in this architecture (catalog/config tables), so the clone can set its own fair values and the UI can be built from the recon's component list without waiting on them.

## Stack

The boss already runs a working voice-chat stack for Vee (React Native + Expo, Firebase Auth + RTDB, LiveKit, Node services on a Windows Contabo VPS, Caddy, Postgres for money, Telegram media storage). The clone reuses it where it fits, because it is already operated (watchdog, deploys, heal jobs) and costs nothing extra. Where YoHo's features need something Vee does not have, the choice is the best fit for that feature, justified below.

| layer | choice | why |
| --- | --- | --- |
| mobile app | Expo (React Native) + TypeScript, **new Expo project** (own project id, own package — never Vee's, never YoHo's) | Same toolchain the boss already ships Vee on; same EAS/OTA workflow. The clone is a separate app, so it gets its own project, bundle id and signing. |
| styling | React Native StyleSheet + design tokens (from replica-design) | Matches Vee's approach; tokens keep the clone's own look consistent. No YoHo colours/copy. |
| voice (media plane) | LiveKit, self-hosted on the VPS, **separate instance/ports and separate room namespace from Vee** | Already proven for Vee group voice; mic seats map to LiveKit participants + metadata. Separation guarantees the clone can never touch Vee's rooms. |
| realtime data | Firebase RTDB, **separate Firebase project from Vee production** (same pattern as vee-test-staging) | Already operated for Vee (rooms, presence, chat). RTDB is the realtime cache for room state, seats, chat, game state. A separate project means clone data never mixes with Vee's. |
| system of record | Postgres on the VPS (same Postgres instance as Vee's wallet, **separate database** for the clone) | Money must be transactional and auditable. Vee's wallet law applies: Postgres is the money truth. A separate database keeps clone money apart from Vee money. |
| API | Node.js + TypeScript (Express) on the VPS, Windows scheduled tasks (same ops pattern as Vee's api-server) | Same deploy + watchdog pattern the boss already runs. One API service; a separate authoritative game service only where realtime game logic needs it (see below). |
| auth | Firebase Auth (Google / Facebook / TikTok / Phone SMS) | Same as Vee; the clone is a separate Firebase project with its own OAuth clients. TikTok login needs the clone's own TikTok developer app. |
| payments | Google Play Billing + App Store IAP (primary); web recharge later | A Play/App Store app must use store billing in-app. The wallet service verifies receipts **server-side** (never trust the client) and enforces the purchase rules (daily diamond cap, attempt limits, >$50 hold). Web recharge is a later milestone, not v1. |
| files / media | Telegram storage backend (Vee media-server pattern), **separate bots/namespace for the clone** | Already proven for Vee: free, unlimited, permanent. Avatars, room covers, Moment photos, voice-intro audio. Separate namespace so clone media never mixes with Vee's. |
| push | FCM (Firebase Cloud Messaging, clone's own Firebase project) | Same as Vee. |
| email | Resend (transactional only: account recovery, 2FA backup) | Cheap and managed; only for "Can't login?" recovery and security mail. |
| jobs | Node job runner on the VPS (Windows scheduled tasks, same pattern as VeeGuard/watchdog) | Mission reset, VIP expiry, event activation, ranking compute, room sweep, wallet heal, settlement run. |
| hosting | Contabo VPS (Windows) + Caddy | Already paid for and operated; Caddy routes the clone's API / media / LiveKit on separate paths and ports. |
| game logic | Node **authoritative game service** + RTDB sync mirror | Games need server-validated moves and stake escrow; the boss's Vee bot pattern (Delicious/PK bots) proves the approach. The game service is the ONLY writer of game state — never the client, never RTDB. |
| voice filters (DSP) | Native audio-processing module (custom dev client / native module), server-gated ownership | The 7 filters need real-time audio DSP, which Expo managed workflow cannot do. Ownership, unlock and activation are server-side (Postgres + RTDB); the DSP is a replaceable client module. See "parts that bite" — this is the #1 risk. |

**On "one database".** The skill's default is one Postgres and no microservices. This clone deviates deliberately, because the boss already operates the split for Vee and each layer has a different job: Postgres is the transactional record (money, durable state), RTDB is the low-latency realtime cache (rooms, seats, chat), LiveKit is the low-latency media plane (voice). What keeps it safe is **one writer per fact**: the wallet service is the only writer of money, the room/game services are the only writers of room/game state, and RTDB mirrors are derived — never an independent truth. No new microservice sprawl: one API service, one game service, one job runner, all on the same VPS.

## Schema

Tables: **37**. Access rules: **data-layer authorisation** — the API, wallet and game services are the only writers; every query checks ownership/role before it runs. Postgres RLS is not used (the boss's services already enforce checks in the data layer, as in Vee). RTDB has its own Firebase rules (separate project); RTDB mirrors are derived from Postgres/LiveKit state, never written directly by clients for money or game outcomes. Full SQL: `schema.sql` in this folder.

Money rule (from Vee, non-negotiable): **all money lives in Postgres.** Coins, Diamonds and Beans are integer units (`bigint`, never float). Fiat is integer cents + a currency column. No client and no RTDB path ever writes a balance; the wallet service applies a ledger row and updates the balance in one transaction, under a row lock. Balances are mirrored to RTDB for display only.

IDs: `id uuid primary key default gen_random_uuid()` everywhere, plus `created_at timestamptz not null default now()` (and `updated_at` where a row mutates). YoHo shows numeric IDs (user 23503486, room 362380) and uses the user ID as the top-up key, so `users.public_id` and `rooms.public_id` are unique numeric display IDs (`bigint`, allocated by a sequence) — the clone's own numbering, never YoHo's.

| # | table | what it holds | key constraints |
| --- | --- | --- | --- |
| 1 | users | profile: public_id, nickname, avatar_url, cover_url, gender, age, country, bio, level, charm, vip_level, server_name, last_active_at, deleted_at | public_id unique; phone / google_id / facebook_id / tiktok_id unique (nullable); level/charm >= 0 |
| 2 | wallets | one row per user: coins, diamonds, beans | user_id unique FK; all balances >= 0; updated only by the wallet service under row lock |
| 3 | wallet_transactions | the money ledger: type, currency, signed amount, balance_after, ref_type/ref_id | user_id + created_at indexed; amount is signed (credit +, debit −); balance_after is the post-transaction balance |
| 4 | rooms | room: public_id, title, cover_url, topic_tags[], host_id, capacity, entry_type, password_hash, theme, status, online_count, diamond_value, ended_at | public_id unique; host FK; entry_type in (open, password, invite_only); status in (live, ended) |
| 5 | mic_seats | one row per seat: room_id, seat_index (0 = host, 1–8), user_id, state, halo_vip_level | UNIQUE(room_id, seat_index); state in (empty, speaking, muted, locked) |
| 6 | room_messages | durable room-chat log (RTDB is the realtime layer): room_id, sender_id, text, type, gift_id | room_id + created_at indexed; type in (text, gift, system); retention policy applies (see jobs) |
| 7 | gifts | gift catalog (clone's own art): name, price_coins, price_diamonds, category, animation_key, localized_country, is_active, sort_order | price >= 0; one of price_coins/price_diamonds may be 0 (free gifts are not in the catalog) |
| 8 | gift_sends | every gift send: sender, receiver, room (nullable), gift, count, totals, intimacy_points | sender/receiver/room/created_at indexed; intimacy_points >= 0 |
| 9 | game_sessions | one game in a room: room_id, game_type, state, stakes_coins, players jsonb, winner_id | game_type in (ludo, uno, dominoes, fishing, parcheesi); state in (waiting, playing, finished, cancelled) |
| 10 | game_moves | turn log for validation/replay: game_session_id, user_id, move_no, move_data jsonb | UNIQUE(game_session_id, move_no); move_no is the server-assigned sequence |
| 11 | moments | Moment post: author_id, photos[], text, likes_count, views_count, country_tag, status | status in (active, hidden, deleted); author + created_at indexed |
| 12 | moment_likes | like join: moment_id, user_id | UNIQUE(moment_id, user_id) |
| 13 | private_chats | 1-to-1 chat: user_a_id, user_b_id, last_message_at | UNIQUE(user_a_id, user_b_id); CHECK(user_a_id < user_b_id) so each pair has one row |
| 14 | chat_messages | DM: chat_id, sender_id, type, content (text or audio_url), duration_sec, sent_at, read_at | chat_id + sent_at indexed; type in (text, voice) |
| 15 | voice_intros | one voice intro per user: user_id, audio_url, duration_sec | user_id unique; duration_sec <= 30 (configurable) |
| 16 | follows | follower_id, following_id | UNIQUE(follower_id, following_id); CHECK(follower_id <> following_id) |
| 17 | vip_progress | VIP 1–10 progress: user_id, level, diamonds_spent, season | user_id unique; level 0–10 |
| 18 | subscriptions | Baron/Duke: user_id, kind, started_at, expires_at, status | kind in (baron, duke); status in (active, expired, cancelled); expires_at = started_at + 30 days |
| 19 | missions | mission catalog: key, type (daily/weekly), title, reward_coins, target_count, target_action | key unique; target_action in (host_minutes, join_rooms, send_gifts, update_profile, login) |
| 20 | mission_progress | per-user per-period: user_id, mission_id, period_start, done_count, claimed, claimed_at | UNIQUE(user_id, mission_id, period_start); period_start is a UTC date |
| 21 | events | event catalog: key, name, type, starts_at, ends_at, multiplier, discount_pct, is_active | type in (gold_rush, ramadan, milestone, referral, seasonal); starts_at/ends_at are UTC |
| 22 | lucky_bags | shared prize bag: room_id, bag_number (66/99), currency, total_value, participants jsonb, claimed_by jsonb, state, expires_at | bag_number in (66, 99); state in (open, claimed, expired); odds live in a server config table, NOT in this row |
| 23 | jackpot_draws | prize draw: room_id, kind, prize_pool_coins, prize_items jsonb, winner_id, state | kind in (greedy, grade, lucky_draw, wheel); state in (open, drawn, paid, expired); odds are server-configured |
| 24 | agencies | agency: name, owner_id, settlement_rate | owner FK; settlement_rate is the clone's own configurable rate |
| 25 | agency_members | membership: agency_id, user_id, role, status, noc_requested_at, noc_granted_at | UNIQUE(agency_id, user_id); role in (owner, host, member); status in (active, pending_noc, left) |
| 26 | agency_settlements | payout record: agency_id, host_id, period_start/end, beans_earned, payout_amount_cents, payout_currency, status, paid_at | status in (pending, paid, held) |
| 27 | room_rankings | ranked rooms: room_id, period, rank, score | UNIQUE(room_id, period); period is a UTC date/week |
| 28 | host_rankings | ranked hosts: user_id, period, rank, score | UNIQUE(user_id, period) |
| 29 | notifications | inbox: user_id, type, title, body, ref_type/ref_id, read | user_id + created_at + read indexed |
| 30 | reports | moderation: reporter_id, target_type, target_id, reason, status, resolved_at | target_type in (user, room, moment, chat); status in (open, actioned, dismissed) |
| 31 | blocks | blocker_id, blocked_id | UNIQUE(blocker_id, blocked_id); CHECK(blocker_id <> blocked_id) |
| 32 | voice_filters | the 7-filter catalog: key, name, tier, category | key unique (crystal_clear_hd, echo_reverb, deep_bass, robot, anime, chipmunk, nature_ambience); tier in (s, a, b) |
| 33 | user_voice_filters | ownership + settings: user_id, filter_id, unlocked, unlocked_at, intensity, is_active_filter | UNIQUE(user_id, filter_id); intensity 0–100; the 7,000-coin bundle unlocks all 7 rows at once |
| 34 | referrals | referrer_id, referee_id, code, status, qualified_at | referee_id unique; status in (pending, qualified, rewarded) |
| 35 | purchases | purchase + verification: user_id, provider, provider_order_id, product_id, amount_cents, currency, coins_granted, diamonds_granted, status, hold_until, attempts_count | provider_order_id unique; provider in (play, app_store, web); status in (pending, completed, held, refunded, failed) |
| 36 | push_tokens | user_id, token, platform | token unique; platform in (android, ios) |
| 37 | audit_log | actor_id, action, target_type, target_id, details jsonb | actor + created_at indexed; every money-affecting and moderation action writes here |

Hard constraints the recon found (database problems, not UI problems):
- **One mic seat per user per room, one user per seat:** `UNIQUE(room_id, seat_index)` + a transaction that claims a seat (row lock on the seat) — two users tapping the same seat at once cannot both get it.
- **One wallet row per user, balances never negative:** `CHECK (coins >= 0 AND diamonds >= 0 AND beans >= 0)` + the wallet service's row lock. A gift send that would overdraw fails the transaction.
- **One private chat per pair:** `UNIQUE(user_a_id, user_b_id)` + `CHECK(user_a_id < user_b_id)`.
- **One Lucky Bag claim per user per bag:** enforced in the claim transaction (check `claimed_by` for the user before inserting; row lock on the bag). The 6-person open is a capacity check in the same transaction.
- **One purchase per provider order:** `provider_order_id UNIQUE` — Play/App Store webhooks arriving twice cannot double-credit.
- **One mission claim per user per period:** `UNIQUE(user_id, mission_id, period_start)`.
- **Game moves are server-sequenced:** `UNIQUE(game_session_id, move_no)`; the game service assigns `move_no` and validates the turn — a client cannot inject or reorder a move.
- **Stakes are escrowed, not held in RTDB:** joining a staked game debits the stake from the wallet (ledger row) and credits the winner on finish; a cancelled game refunds. The game service owns this, not the client.

## API

Base: `/api/v1` on the VPS API service. Auth: Firebase ID token (Bearer) on every route except the public auth routes. Every money route runs through the wallet service (single writer). Every game route runs through the game service (authoritative). Idempotency: clients send an `Idempotency-Key` header on POSTs that move money or claim a prize; the server stores the key with the result and replays it on retry. Confidence per flow: `high` = verified from public sources, `medium` = named in text, no screenshot, `low` = inferred from reviews only.

| method path | does | who | input | output | flow | conf |
| --- | --- | --- | --- | --- | --- | --- |
| POST /auth/phone/send-code | send SMS code | public | {phone} | {sent} | F01 | high |
| POST /auth/phone/verify | verify code → session | public | {phone, code} | {user, token} | F01 | high |
| POST /auth/google | Google ID token → session | public | {id_token} | {user, token} | F01 | high |
| POST /auth/facebook | Facebook token → session | public | {access_token} | {user, token} | F01 | high |
| POST /auth/tiktok | TikTok code → session | public | {code} | {user, token} | F01 | high |
| POST /auth/recover | "Can't login?" recovery mail/SMS | public | {identifier} | {sent} | F01 | high |
| POST /users/me/profile | first-time profile setup | auth | {nickname, avatar_url, gender, age, country, bio} | {user} | F01 | medium |
| GET /users/me | own profile + balances (mirrored) | auth | — | {user} | F01 | high |
| GET /rooms?tab=hot\|related&topic=&page= | live room list | auth | query | {rooms[]} | F02 | high |
| GET /rooms/:id | room detail + seats + host | auth | — | {room, seats, host} | F02 | high |
| POST /rooms/:id/join | join room (checks entry conditions, capacity) → LiveKit token | auth | {password?} | {room, livekit_token} | F02 | high |
| POST /rooms/:id/leave | leave room, free seat | auth | — | {ok} | F02 | high |
| GET /rooms/search?q= | search rooms | auth | query | {rooms[]} | F02 | medium |
| GET /users/search?q= | search users | auth | query | {users[]} | F02 | medium |
| POST /rooms | create a room | auth | {title, topic_tags, cover_url, capacity, entry_type, password?, theme} | {room} | F03 | medium |
| PATCH /rooms/:id | update room settings | host | {title, capacity, entry_type, …} | {room} | F03 | medium |
| POST /rooms/:id/end | end room (closes LiveKit room, frees seats) | host | — | {ok} | F03 | medium |
| POST /rooms/:id/seats/:seat/lock | lock / unlock a seat | host | {locked} | {seat} | F03 | medium |
| POST /rooms/:id/seats/:seat/kick | remove a user from a seat | host | — | {ok} | F03 | medium |
| GET /rooms/:id/games | games available in this room | auth | — | {games[]} | F04 | high |
| POST /rooms/:id/games | start a game session (escrows stakes) | auth (seat holder) | {game_type, stakes_coins} | {game_session} | F04 | high |
| POST /games/:id/join | join a game | auth | — | {game_session} | F04 | medium |
| POST /games/:id/move | submit a move (server validates turn + sequence) | auth (player) | {move} | {game_state} | F04 | medium |
| POST /games/:id/leave | leave / become spectator | auth | — | {ok} | F04 | medium |
| GET /games/:id | game state + move log | auth | — | {game_session, moves} | F04 | medium |
| GET /gifts?country= | gift catalog (clone's own art) | auth | query | {gifts[]} | F05 | high |
| POST /rooms/:id/gifts | send a gift in a room (debits wallet, credits host Beans, adds intimacy) | auth | {gift_id, receiver_id, count} | {gift_send, balances, intimacy} | F05 | high |
| POST /chats/:id/gifts | send a gift in a private chat | auth | {gift_id, count} | {gift_send} | F05 | medium |
| GET /users/:id/gifts | gifts received (with counts) | auth | — | {gifts[]} | F05 | high |
| GET /discover/voice-intros | suggested users with voice intros | auth | query | {users[]} | F06 | medium |
| GET /users/:id/voice-intro | a user's voice intro audio | auth | — | {audio_url, duration} | F06 | medium |
| POST /users/me/voice-intro | record / upload own voice intro | auth | {audio} | {voice_intro} | F06 | medium |
| POST /chats | start a private chat ("say hi") | auth | {user_id, text?} | {chat} | F06 | medium |
| GET /chats | private-chat list | auth | — | {chats[]} | F06 | medium |
| GET /chats/:id/messages | chat history | auth (participant) | query | {messages[]} | F06 | medium |
| POST /chats/:id/messages | send text / voice message | auth (participant) | {type, content} | {message} | F06 | medium |
| GET /wallet | coin / diamond / bean balances | auth | — | {coins, diamonds, beans} | F07 | high |
| GET /wallet/packs?type=coins\|diamonds | pack list + prices | auth | query | {packs[]} | F07 | high |
| POST /wallet/purchase | create a purchase (Play / App Store / web) | auth | {product_id, provider} | {purchase} | F07 | high |
| POST /wallet/purchase/verify | verify receipt server-side, credit wallet (idempotent) | auth | {purchase_id, receipt} | {purchase, balances} | F07 | high |
| GET /wallet/transactions | transaction history | auth | query | {transactions[]} | F07 | medium |
| POST /wallet/web-recharge | web recharge checkout (later milestone) | auth | {pack_id, provider} | {checkout_url} | F07 | medium |
| GET /voice-filters | the 7-filter catalog | auth | — | {filters[]} | F08 | high |
| POST /voice-filters/unlock | unlock all 7 (7,000 coins, one payment, permanent) | auth | — | {filters, balance} | F08 | high |
| POST /voice-filters/:id/activate | set the active filter | auth (owner) | {intensity} | {filter} | F08 | high |
| PATCH /voice-filters/:id | set filter intensity (0–100) | auth (owner) | {intensity} | {filter} | F08 | medium |
| GET /voice-filters/preview/:id | 5-second preview (client-side) | auth | — | {preview_url} | F08 | medium |
| GET /missions | mission board (daily + weekly) + progress | auth | — | {missions[], progress} | F09 | high |
| POST /missions/:id/claim | claim a mission reward | auth | — | {coins, balance} | F09 | high |
| GET /missions/streak | login streak | auth | — | {streak, next} | F09 | medium |
| GET /rooms/:id/lucky-bags | active bags in a room | auth | — | {bags[]} | F10 | medium |
| POST /rooms/:id/lucky-bags | drop a bag (66 / 99) | auth | {bag_number} | {bag} | F10 | medium |
| POST /lucky-bags/:id/open | open / claim a bag (one claim per user, atomic) | auth | — | {amount, balance} | F10 | medium |
| GET /vip | VIP status + progress + perks | auth | — | {level, progress, perks} | F11 | high |
| GET /vip/tiers | tier list + costs (VIP 1–10, Baron, Duke) | auth | — | {tiers[]} | F11 | high |
| POST /vip/subscribe | buy Baron / Duke (30 days) | auth | {kind} | {subscription, balance} | F11 | high |
| POST /vip/cancel | cancel a subscription | auth | {kind} | {ok} | F11 | medium |
| POST /users/:id/follow | follow a user | auth | — | {ok} | F12 | high |
| POST /users/:id/unfollow | unfollow | auth | — | {ok} | F12 | high |
| POST /users/:id/friend | add friend | auth | — | {ok} | F12 | high |
| GET /users/:id/fans | fans list | auth | — | {users[]} | F12 | high |
| GET /users/:id/following | following list | auth | — | {users[]} | F12 | high |
| GET /moments?tab=related\|hot | Moments feed | auth | query | {moments[]} | F13 | high |
| POST /moments | post a Moment (photo + text) | auth | {photos[], text} | {moment} | F13 | medium |
| GET /moments/:id | Moment detail | auth | — | {moment} | F13 | medium |
| POST /moments/:id/like | like | auth | — | {likes} | F13 | medium |
| POST /moments/:id/unlike | unlike | auth | — | {ok} | F13 | medium |
| GET /wallet/beans | Beans balance + host earnings | auth (host) | — | {beans, earnings} | F14 | high |
| POST /wallet/beans/settle | request a settlement (via agency) | auth (host) | {amount} | {settlement} | F14 | medium |
| GET /wallet/settlements | settlement history | auth | — | {settlements[]} | F14 | medium |
| GET /agencies/:id | agency detail + members | auth | — | {agency, members} | F15 | low |
| POST /agencies | create an agency (become owner) | auth | {name} | {agency} | F15 | low |
| POST /agencies/:id/join | apply / join an agency | auth | — | {membership} | F15 | low |
| POST /agencies/:id/noc | request an NOC to switch agency | auth (member) | — | {noc_request} | F15 | medium |
| POST /agencies/:id/noc/grant | grant an NOC | agency owner | {user_id} | {ok} | F15 | medium |
| POST /agencies/:id/noc/deny | deny an NOC | agency owner | {user_id} | {ok} | F15 | low |
| GET /agencies/:id/settlements | agency settlements | agency owner | query | {settlements[]} | F15 | low |
| POST /reports | report a user / room / moment / chat | auth | {target_type, target_id, reason} | {report} | safety | medium |
| POST /users/:id/block | block a user | auth | — | {ok} | safety | medium |
| POST /users/:id/unblock | unblock | auth | — | {ok} | safety | medium |
| GET /notifications | notification list | auth | query | {notifications[]} | notif | medium |
| POST /notifications/:id/read | mark a notification read | auth | — | {ok} | notif | medium |
| GET /events | active events (Gold Rush, Ramadan, Milestone, referral) | auth | — | {events[]} | events | high |
| GET /rankings/rooms?period= | room leaderboard | auth | query | {rankings[]} | rankings | medium |
| GET /rankings/hosts?period= | host leaderboard | auth | query | {rankings[]} | rankings | medium |
| POST /referrals/claim | claim a referral reward | auth | {code} | {reward} | referral | medium |
| GET /users/:id | public profile | auth | — | {user} | profile | high |
| PATCH /users/me | edit own profile | auth | {fields} | {user} | profile | medium |
| GET /users/me/id | own public numeric ID (the top-up key) | auth | — | {public_id} | profile | high |
| POST /rooms/:id/record | start / stop room recording | host | {start} | {recording} | room | medium |
| GET /settings | app settings | auth | — | {settings} | settings | low |
| POST /settings/2fa/enable | enable 2FA | auth | — | {ok} | security | medium |
| POST /settings/2fa/verify | verify a 2FA code | auth | {code} | {ok} | security | medium |

Routes: **93**. Realtime (not REST) runs over RTDB + LiveKit: room state, mic seats, presence, room chat, game state mirror, gift animations, typing/online indicators. The REST API is the source of truth; RTDB is the delivery channel.

Webhooks in: Google Play Developer API (purchase verification + RTDN notifications — a purchase is only credited after the server verifies the receipt with Google); App Store Server Notifications (same rule for Apple); Resend (email delivery events — informational only). No other inbound webhooks. Never YoHo's private endpoints.
Webhooks out: none in v1 (no external integrations). Agency payouts, if a payout provider is added later, go through the wallet service — never directly from the app.

Jobs (Node job runner on the VPS; Windows scheduled tasks, same pattern as VeeGuard):
| job | schedule | what it does |
| --- | --- | --- |
| mission-reset | daily 00:00 UTC | reset daily missions, roll the login streak, expire weekly missions |
| vip-expiry | hourly | expire Baron/Duke, recompute VIP levels from lifetime diamonds |
| event-activation | every 15 min | activate/expire events (Gold Rush 7–9 PM, Ramadan, Milestone, referral) |
| lucky-bag-expiry | every 5 min | expire unclaimed bags, refund the dropper if unopened |
| ranking-compute | hourly + daily rollup | room + host rankings from gift/score data |
| room-sweep | every 5 min | end rooms with no host/participants, free stale seats (Vee's stale-seat sweep pattern) |
| wallet-heal | daily | reconcile Postgres balances against the ledger; alert on mismatch (Vee's wallet-heal pattern) |
| settlement-run | weekly | compute agency settlements, create payout records, hold payouts pending review |
| noc-auto-grant | daily | auto-grant NOCs where the agency owner has been inactive >= 14 days (the "stuck host" fix) |
| media-cleanup | daily | delete orphaned uploads (no referencing row) |
| chat-retention | daily | trim room_messages older than the retention window (90 days, configurable) |
| user-deletion | on request + daily | hard-delete a user who asked: anonymise messages, delete media, zero balances, revoke tokens |

## The parts that bite

- **Time zones:** missions reset at **UTC 00:00 sharp** (a missed day is lost — users must see the reset time in their own zone). Gold Rush runs 7–9 PM (the event row stores its timezone explicitly; the server converts to UTC). VIP expiry, event windows and ranking periods are all UTC in the database; the client only formats.
- **Idempotency:** Play/App Store webhooks arrive twice — `provider_order_id UNIQUE` makes the second delivery a no-op. Gift sends carry a client `Idempotency-Key` so a double-tap cannot double-charge. Lucky Bag opens and mission claims are idempotent by their unique constraints. The game service replays a retried move from the stored `move_no` instead of applying it twice.
- **Races:** mic-seat claims (row lock on the seat), wallet debits (row lock on the wallet + ledger in one transaction), game moves (server-assigned sequence, turn validation), room joins at capacity (atomic seat-count check), Lucky Bag claims (row lock on the bag, one claim per user). Nothing that moves money or a seat is decided in the client or in RTDB.
- **Rate limits:** gift sends, room chat, room creation, purchase attempts (max 3 / 24h is already a business rule), voice-intro uploads. Enforced in the API, not the UI.
- **File size limits:** Moment photos (max 5 MB each, max 4 per Moment), avatars (2 MB), voice intros (30 s, ~1 MB). The media service rejects oversize uploads before storing.
- **Search:** rooms + users search runs on Postgres (`pg_trgm` + full-text on title/nickname) for v1. At scale this becomes a dedicated index — noted, not built now.
- **Realtime:** RTDB is the delivery channel, Postgres is the truth. Room chat, seats, presence and game mirrors live in RTDB; if RTDB and Postgres disagree, Postgres wins and the mirror is rebuilt. LiveKit is voice only — it never holds money, seats or game state.
- **Offline:** the app must not crash offline (cached room list, queued chat send with retry). Offline is a design requirement for the client, not a v1 blocker for the server.
- **Email deliverability:** only recovery + 2FA mail goes out (Resend). No marketing mail in v1.
- **Multi-tenancy:** the agency model is the tenancy boundary — every agency-scoped query checks membership in the data layer. A host must never see another agency's settlement rows.
- **GDPR deletion:** a deletion request anonymises the user's messages (sender becomes "deleted user"), deletes their media, zeroes balances, revokes push tokens and Firebase sessions, and writes an audit row. The `users.deleted_at` soft-delete marks the row first; the job hard-deletes after 30 days.
- **Money (the big one):** three currencies with no conversion, purchase caps/holds, host cash-out, agency settlement. A single money bug is a real financial loss. Mitigations: Postgres-only money, single-writer wallet service, ledger + balance, server-side receipt verification, daily wallet-heal reconciliation, audit log on every money action.
- **Voice:** LiveKit room lifecycle (created on room create, destroyed on room end), TURN for NAT traversal (Vee's own TURN), echo cancellation and speaker/earpiece routing (Vee's Bluetooth lesson applies — the clone inherits it). A room with no host must end (room-sweep job), never linger as a ghost room.
- **Games:** authoritative server only. The client renders; the server validates every move, owns the dice/RNG, escrows stakes and pays the winner. A client-trusted game is a cheating + stake-theft hole.
- **Voice filters (DSP):** the hardest feature. Real-time audio DSP cannot run in Expo managed workflow; it needs a native module + a custom dev client. The architecture isolates it: ownership/unlock/activation are server-side and work from day one; the DSP module is a replaceable client piece. If the DSP is not ready, a filter shows as owned-but-inactive rather than silently doing nothing.
- **Scale:** the clone starts empty (no 27M users), so v1 is designed for the boss's single VPS. The split (stateless Node services + Postgres + RTDB + LiveKit) supports horizontal scale-out later, but no scale-out is built now. Do not over-build for scale the clone does not have.

## Build order

The boss ordered the **full** clone, nothing left out — so this order covers all 128 buildable features (57 must + 53 should + 18 could). The 8 `skip` rows are not built; their replacements (own brand, own art, own payment path, own odds) are part of the milestones below. Each milestone lists its screens (S-IDs), tables and routes.

1. **Vertical slice — the core loop end to end, ugly.** Sign up → discover a room → join → take a mic seat → talk → chat → leave. Screens: S02, S03, S04, S05, S07. Tables: users, wallets, wallet_transactions, rooms, mic_seats, room_messages, push_tokens. Routes: auth (phone/Google/Facebook/TikTok), profile setup, room list/detail/join/leave, LiveKit token. Proves the stack (Expo + Firebase Auth + RTDB + LiveKit + VPS API). Nothing else until this works on a real phone.
2. **Must-haves, by area.**
   - Onboarding (F01): full sign-up incl. SMS, recovery, profile setup. S01–S04.
   - Voice rooms (F02/F03): create room, entry conditions (open/password/invite-only), seat rules, mute/speaker, room chat, Record, room "…" menu, exit. S05–S08, S31. Tables: rooms, mic_seats, room_messages.
   - Gifts (F05): catalog, send in room + private chat, intimacy, gift animations (own art). S22. Tables: gifts, gift_sends.
   - Wallet (F07): packs, purchase + server-side verification, caps/holds, transaction history. S20. Tables: wallets, wallet_transactions, purchases.
   - Private chat (F06): voice-intro discovery, listen, "say hi", 1-to-1 text + voice messages, 1-to-1 call. S15, S16, S38. Tables: voice_intros, private_chats, chat_messages.
   - Profile + social (F12): view/edit profile, avatar + cover, bio, follow/friend, fans/following, copy public ID. S18, S19, S34. Tables: follows.
   - Games (F04): Ludo first (most visible), then Dominoes, Uno, arcade fishing, Parcheesi. S10–S12. Tables: game_sessions, game_moves. Stakes escrowed from day one.
   - Safety: report, block, 2FA. S27, S28. Tables: reports, blocks.
3. **Should-haves.**
   - Moments (F13): feed, post, like, detail. S13, S14. Tables: moments, moment_likes.
   - Missions (F09): board, daily + weekly, claim, login streak. S26. Tables: missions, mission_progress. Job: mission-reset.
   - Events (F25): Gold Rush, Ramadan, Milestone, referral. S25. Tables: events, referrals. Job: event-activation.
   - VIP (F11): tiers 1–10, Baron/Duke, entrance effects, frames, bubbles, halos. S21. Tables: vip_progress, subscriptions. Job: vip-expiry.
   - Voice filters (F08): the 7-filter catalog, 7,000-coin bundle unlock, activation, intensity, preview. S09. Tables: voice_filters, user_voice_filters. DSP module is the long pole here — server-gated ownership ships first.
   - Lucky Bag (F10): drop, 6-person open, claim. S23. Tables: lucky_bags. Job: lucky-bag-expiry.
   - Rankings (F32): room + host leaderboards. S32. Tables: room_rankings, host_rankings. Job: ranking-compute.
   - Agency (F15): create/join, NOC flow (incl. the 14-day auto-grant fix), settlement. S33. Tables: agencies, agency_members, agency_settlements. Job: settlement-run, noc-auto-grant.
   - Discovery polish: activity rooms, banner carousel, Events entry, search. S06, S30.
   - Notifications, settings, customer service. S27, S29, S36. Tables: notifications, push_tokens.
4. **Could-haves.**
   - Lucky Draw & Wheel, Greedy/Grade Jackpot. S24. Tables: jackpot_draws. (Odds are server-configured; the clone publishes no odds it cannot honour.)
   - Cars collection on profile, country tags on Moments, game promo cards in the feed, VIP streak protection (VIP4–6) and cooldown reduction (VIP7–10), in-app support bot, squad participation + follower milestones. S18, S13, S21, S36, S32.
   - Web recharge (m.yoho.media equivalent) — after store billing is proven.
5. **Fixes from replica-entrepreneur** (once it has run — it has not run yet). The entrepreneur step reads real user reviews of YoHo and turns what users hate into fixes + a positioning angle; those fixes land here, after the could-haves.

Out of scope for the build (the 8 `skip` rows, replaced not rebuilt): YoHo's 27M-user network (the clone starts empty), YoHo's brand/name/logo/copy (the clone gets its own in replica-brand), YoHo's gift/car/entrance art (the clone commissions its own art for the same slots), licensed music (the clone uses no licensed catalogue), Play/App Store billing + third-party top-up platforms as a product (the clone uses store billing with its own accounts), the agency/creator network and its deals (the clone builds its own agency system from zero), exact Lucky Bag / Jackpot odds (the clone sets its own fair, published odds), YoHo Lite (a separate app — rescope after the main clone).

## Summary

- **Stack in one line:** Expo (React Native) + TypeScript app; Firebase Auth + RTDB (separate project); LiveKit self-hosted (separate instance); Postgres on the VPS (separate database, money truth); Node + TypeScript API + authoritative game service + job runner on the Contabo VPS behind Caddy; Telegram media storage (separate namespace); Play/App Store billing with server-side verification.
- **Tables: 37. Routes: 93. Jobs: 12.**
- **Three riskiest parts:** (1) voice-filter DSP — real-time audio processing needs a native module; Expo managed cannot do it; (2) money — three currencies + caps/holds + host cash-out + agency settlement, where one bug is a real financial loss; (3) authoritative realtime games — server-validated moves + escrowed stakes + live sync, where a client-trusted game is a cheating hole.
- **Next step:** `/replica-design` — rebuild the design system (colours, type, spacing, components as tokens, with the clone's own assets) from the recon's component list.
