-- Schema: YoHo clone (full clone, clean-room)
-- Postgres 15+. One database for the clone (separate from Vee's wallet database).
-- Money rule: all money lives here. No client and no RTDB path ever writes a balance.
-- IDs: uuid primary keys; public_id is the numeric display ID (YoHo-style, clone's own numbering).
-- Times: timestamptz, UTC. Money: bigint integer units + currency; fiat is integer cents.
-- Companion doc: architecture.md in this folder.

create extension if not exists pgcrypto;

-- Numeric display IDs (user public_id, room public_id). Allocated by the API from these sequences.
create sequence if not exists user_public_id_seq start with 10000001;
create sequence if not exists room_public_id_seq start with 100001;

-- Auto-maintain updated_at.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ users / wallets ============

create table users (
  id uuid primary key default gen_random_uuid(),
  public_id bigint not null unique default nextval('user_public_id_seq'),
  nickname text not null,
  avatar_url text,
  cover_url text,
  gender text check (gender in ('male', 'female', 'other')),
  age integer check (age is null or (age >= 13 and age <= 120)),
  country text,
  bio text,
  level integer not null default 1 check (level >= 1),
  charm integer not null default 0 check (charm >= 0),
  vip_level integer not null default 0 check (vip_level >= 0 and vip_level <= 10),
  server_name text,
  phone text unique,
  google_id text unique,
  facebook_id text unique,
  tiktok_id text unique,
  is_host boolean not null default false,
  last_active_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on users (nickname);
create index on users (country, level);
create trigger users_updated_at before update on users
  for each row execute function set_updated_at();

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  coins bigint not null default 0 check (coins >= 0),
  diamonds bigint not null default 0 check (diamonds >= 0),
  beans bigint not null default 0 check (beans >= 0),
  updated_at timestamptz not null default now()
);
create trigger wallets_updated_at before update on wallets
  for each row execute function set_updated_at();

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('purchase', 'gift_send', 'gift_receive', 'earn', 'settlement', 'mission', 'refund', 'adjustment')),
  currency text not null check (currency in ('coins', 'diamonds', 'beans')),
  amount bigint not null,
  balance_after bigint not null check (balance_after >= 0),
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index on wallet_transactions (user_id, created_at desc);
create index on wallet_transactions (ref_type, ref_id);

-- ============ rooms / seats / room chat ============

create table rooms (
  id uuid primary key default gen_random_uuid(),
  public_id bigint not null unique default nextval('room_public_id_seq'),
  title text not null,
  cover_url text,
  topic_tags text[] not null default '{}',
  host_id uuid not null references users(id) on delete restrict,
  capacity integer not null default 8 check (capacity >= 1 and capacity <= 50),
  entry_type text not null default 'open' check (entry_type in ('open', 'password', 'invite_only')),
  password_hash text,
  theme text,
  status text not null default 'live' check (status in ('live', 'ended')),
  online_count integer not null default 0 check (online_count >= 0),
  diamond_value bigint not null default 0 check (diamond_value >= 0),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index on rooms (status, created_at desc);
create index on rooms (host_id, created_at desc);

create table mic_seats (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  seat_index integer not null check (seat_index >= 0 and seat_index <= 8),
  user_id uuid references users(id) on delete set null,
  state text not null default 'empty' check (state in ('empty', 'speaking', 'muted', 'locked')),
  halo_vip_level integer not null default 0 check (halo_vip_level >= 0 and halo_vip_level <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, seat_index)
);
create index on mic_seats (room_id);
create index on mic_seats (user_id);
create trigger mic_seats_updated_at before update on mic_seats
  for each row execute function set_updated_at();

create table room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  text text,
  type text not null default 'text' check (type in ('text', 'gift', 'system')),
  gift_id uuid,
  created_at timestamptz not null default now()
);
create index on room_messages (room_id, created_at desc);

-- ============ gifts ============

create table gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_coins bigint not null default 0 check (price_coins >= 0),
  price_diamonds bigint not null default 0 check (price_diamonds >= 0),
  category text not null,
  animation_key text,
  localized_country text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on gifts (category, sort_order);
create trigger gifts_updated_at before update on gifts
  for each row execute function set_updated_at();

create table gift_sends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  room_id uuid references rooms(id) on delete set null,
  gift_id uuid not null references gifts(id) on delete restrict,
  count integer not null default 1 check (count >= 1),
  total_coins bigint not null default 0 check (total_coins >= 0),
  total_diamonds bigint not null default 0 check (total_diamonds >= 0),
  intimacy_points integer not null default 0 check (intimacy_points >= 0),
  created_at timestamptz not null default now()
);
create index on gift_sends (sender_id, created_at desc);
create index on gift_sends (receiver_id, created_at desc);
create index on gift_sends (room_id, created_at desc);

-- ============ games ============

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  game_type text not null check (game_type in ('ludo', 'uno', 'dominoes', 'fishing', 'parcheesi')),
  state text not null default 'waiting' check (state in ('waiting', 'playing', 'finished', 'cancelled')),
  stakes_coins bigint not null default 0 check (stakes_coins >= 0),
  players jsonb not null default '[]',
  winner_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index on game_sessions (room_id, created_at desc);
create index on game_sessions (state, created_at desc);

create table game_moves (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references game_sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  move_no integer not null check (move_no >= 1),
  move_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (game_session_id, move_no)
);
create index on game_moves (game_session_id, move_no);

-- ============ moments ============

create table moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  photos text[] not null default '{}',
  text text,
  likes_count integer not null default 0 check (likes_count >= 0),
  views_count integer not null default 0 check (views_count >= 0),
  country_tag text,
  status text not null default 'active' check (status in ('active', 'hidden', 'deleted')),
  created_at timestamptz not null default now()
);
create index on moments (author_id, created_at desc);
create index on moments (status, created_at desc);

create table moment_likes (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references moments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);
create index on moment_likes (user_id, created_at desc);

-- ============ private chats / voice intros ============

create table private_chats (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);
create index on private_chats (user_a_id, last_message_at desc);
create index on private_chats (user_b_id, last_message_at desc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references private_chats(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  type text not null default 'text' check (type in ('text', 'voice')),
  content text not null,
  duration_sec integer check (duration_sec is null or duration_sec > 0),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);
create index on chat_messages (chat_id, sent_at);

create table voice_intros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  audio_url text not null,
  duration_sec integer not null check (duration_sec > 0 and duration_sec <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger voice_intros_updated_at before update on voice_intros
  for each row execute function set_updated_at();

-- ============ follows ============

create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
create index on follows (follower_id, created_at desc);
create index on follows (following_id, created_at desc);

-- ============ VIP / subscriptions ============

create table vip_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  level integer not null default 0 check (level >= 0 and level <= 10),
  diamonds_spent bigint not null default 0 check (diamonds_spent >= 0),
  season text,
  updated_at timestamptz not null default now()
);
create trigger vip_progress_updated_at before update on vip_progress
  for each row execute function set_updated_at();

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('baron', 'duke')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on subscriptions (user_id, kind, status);

-- ============ missions / events ============

create table missions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  type text not null check (type in ('daily', 'weekly')),
  title text not null,
  reward_coins bigint not null default 0 check (reward_coins >= 0),
  target_count integer not null default 1 check (target_count >= 1),
  target_action text not null check (target_action in ('host_minutes', 'join_rooms', 'send_gifts', 'update_profile', 'login')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  period_start date not null,
  done_count integer not null default 0 check (done_count >= 0),
  claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, mission_id, period_start)
);
create index on mission_progress (user_id, period_start);

create table events (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  type text not null check (type in ('gold_rush', 'ramadan', 'milestone', 'referral', 'seasonal')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  multiplier numeric(5, 2) not null default 1.00 check (multiplier > 0),
  discount_pct integer not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on events (starts_at, ends_at);

-- ============ lucky bag / jackpot ============

create table lucky_bags (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  bag_number integer not null check (bag_number in (66, 99)),
  currency text not null default 'coins' check (currency in ('coins', 'diamonds')),
  total_value bigint not null check (total_value > 0),
  participants jsonb not null default '[]',
  claimed_by jsonb not null default '{}',
  state text not null default 'open' check (state in ('open', 'claimed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index on lucky_bags (room_id, state);
create index on lucky_bags (state, expires_at);

create table jackpot_draws (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  kind text not null check (kind in ('greedy', 'grade', 'lucky_draw', 'wheel')),
  prize_pool_coins bigint not null default 0 check (prize_pool_coins >= 0),
  prize_items jsonb not null default '[]',
  winner_id uuid references users(id) on delete set null,
  state text not null default 'open' check (state in ('open', 'drawn', 'paid', 'expired')),
  created_at timestamptz not null default now()
);
create index on jackpot_draws (state, created_at desc);

-- ============ agency ============

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references users(id) on delete restrict,
  settlement_rate numeric(5, 4) not null default 0.5000 check (settlement_rate >= 0 and settlement_rate <= 1),
  created_at timestamptz not null default now()
);
create index on agencies (owner_id);

create table agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'host' check (role in ('owner', 'host', 'member')),
  status text not null default 'active' check (status in ('active', 'pending_noc', 'left')),
  noc_requested_at timestamptz,
  noc_granted_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (agency_id, user_id)
);
create index on agency_members (agency_id, status);
create index on agency_members (user_id, status);

create table agency_settlements (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  host_id uuid not null references users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  beans_earned bigint not null default 0 check (beans_earned >= 0),
  payout_amount_cents bigint not null default 0 check (payout_amount_cents >= 0),
  payout_currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'paid', 'held')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (period_end >= period_start)
);
create index on agency_settlements (agency_id, period_start);
create index on agency_settlements (host_id, period_start);

-- ============ rankings ============

create table room_rankings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  period date not null,
  rank integer not null check (rank >= 1),
  score bigint not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  unique (room_id, period)
);
create index on room_rankings (period, score desc);

create table host_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  period date not null,
  rank integer not null check (rank >= 1),
  score bigint not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, period)
);
create index on host_rankings (period, score desc);

-- ============ notifications / safety ============

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  ref_type text,
  ref_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);
create index on notifications (user_id, read, created_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('user', 'room', 'moment', 'chat')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on reports (status, created_at desc);
create index on reports (target_type, target_id);

create table blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references users(id) on delete cascade,
  blocked_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on blocks (blocker_id);
create index on blocks (blocked_id);

-- ============ voice filters ============

create table voice_filters (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  tier text not null check (tier in ('s', 'a', 'b')),
  category text not null default 'premium_2026',
  is_active boolean not null default true
);

create table user_voice_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  filter_id uuid not null references voice_filters(id) on delete cascade,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  intensity integer not null default 70 check (intensity >= 0 and intensity <= 100),
  is_active_filter boolean not null default false,
  unique (user_id, filter_id)
);
create index on user_voice_filters (user_id);

-- ============ referrals / purchases / push / audit ============

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referee_id uuid not null unique references users(id) on delete cascade,
  code text not null,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'rewarded')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz
);
create index on referrals (referrer_id, created_at desc);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('play', 'app_store', 'web')),
  provider_order_id text not null unique,
  product_id text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'USD',
  coins_granted bigint not null default 0 check (coins_granted >= 0),
  diamonds_granted bigint not null default 0 check (diamonds_granted >= 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'held', 'refunded', 'failed')),
  hold_until timestamptz,
  attempts_count integer not null default 1 check (attempts_count >= 1),
  created_at timestamptz not null default now()
);
create index on purchases (user_id, created_at desc);
create index on purchases (status, created_at desc);

create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now()
);
create index on push_tokens (user_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on audit_log (actor_id, created_at desc);
create index on audit_log (target_type, target_id);

-- ============ seed: the 7 confirmed premium voice filters ============
-- Names are community-confirmed (BitTopup 2026 guides). One 7,000-coin payment unlocks all 7.
insert into voice_filters (key, name, tier) values
  ('crystal_clear_hd', 'Crystal Clear HD Enhancement', 's'),
  ('echo_reverb', 'Echo & Reverb Enhancement', 's'),
  ('deep_bass', 'Deep Bass Transformer', 'a'),
  ('robot', 'Robot Voice Modifier', 'a'),
  ('anime', 'Anime Voice Filter', 'b'),
  ('chipmunk', 'Chipmunk Pitch-Up Filter', 'b'),
  ('nature_ambience', 'Nature Ambience Layer', 'b')
on conflict (key) do nothing;
