-- ╔══════════════════════════════════════════════════════════╗
-- ║         KNIGHT'S PASS — Supabase Schema v1               ║
-- ╚══════════════════════════════════════════════════════════╝

-- Extensions
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  path          text not null default 'light' check (path in ('light','shadow')),
  level         int  not null default 1,
  xp            int  not null default 0,
  xp_to_next    int  not null default 100,
  silver        int  not null default 500,
  gold          int  not null default 0,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Automatisch Profil anlegen wenn User sich registriert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at Trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- INVENTAR
-- ──────────────────────────────────────────────────────────
create table public.inventory (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references public.profiles(id) on delete cascade,
  item_id     text not null,
  quantity    int  not null default 1 check (quantity >= 0),
  created_at  timestamptz not null default now(),
  unique(player_id, item_id)
);

-- ──────────────────────────────────────────────────────────
-- GAME SESSIONS
-- ──────────────────────────────────────────────────────────
create table public.game_sessions (
  id            uuid primary key default uuid_generate_v4(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  game_type     text not null check (game_type in ('heisse_fackel','werwolf','imposter','kutschen')),
  difficulty    int  not null default 1 check (difficulty between 1 and 3),
  status        text not null default 'waiting' check (status in ('waiting','active','finished')),
  join_code     text not null unique,
  max_players   int  not null default 8,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

-- Index für schnelles Suchen per Join-Code
create index game_sessions_join_code_idx on public.game_sessions(join_code);
create index game_sessions_status_idx    on public.game_sessions(status);

-- ──────────────────────────────────────────────────────────
-- SESSION SPIELER
-- ──────────────────────────────────────────────────────────
create table public.session_players (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.game_sessions(id) on delete cascade,
  player_id   uuid references public.profiles(id) on delete set null,
  guest_name  text,
  seat_index  int  not null check (seat_index between 0 and 7),
  path        text not null default 'light' check (path in ('light','shadow')),
  joined_at   timestamptz not null default now(),
  unique(session_id, seat_index),
  -- Entweder Spieler-Profil oder Gastname
  check (player_id is not null or guest_name is not null)
);

-- ──────────────────────────────────────────────────────────
-- XP LOG
-- ──────────────────────────────────────────────────────────
create table public.xp_log (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references public.profiles(id) on delete cascade,
  source      text not null,
  amount      int  not null,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.inventory        enable row level security;
alter table public.game_sessions    enable row level security;
alter table public.session_players  enable row level security;
alter table public.xp_log           enable row level security;

-- PROFILES: Jeder kann eigenes Profil lesen/schreiben
create policy "profiles_select_own"  on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);
-- Andere Profile lesen (für Lobby/Gast-Join)
create policy "profiles_select_all"  on public.profiles for select using (true);

-- INVENTORY: Nur eigenes sichtbar
create policy "inventory_own"        on public.inventory for all using (auth.uid() = player_id);

-- GAME SESSIONS: Alle sehen aktive Sessions, Host kann editieren
create policy "sessions_select"      on public.game_sessions for select using (status != 'finished');
create policy "sessions_insert"      on public.game_sessions for insert with check (auth.uid() = host_id);
create policy "sessions_update_host" on public.game_sessions for update using (auth.uid() = host_id);

-- SESSION PLAYERS: Alle in der Session sehen die Mitspieler
create policy "session_players_select" on public.session_players for select using (true);
create policy "session_players_insert" on public.session_players for insert with check (true);
create policy "session_players_delete" on public.session_players for delete using (auth.uid() = player_id);

-- XP LOG: Nur eigene XP sichtbar
create policy "xp_log_own"           on public.xp_log for select using (auth.uid() = player_id);

-- ──────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ──────────────────────────────────────────────────────────

-- Zufälligen 6-stelligen Join-Code generieren
create or replace function public.generate_join_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := '';
  i     int;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- XP hinzufügen + Level-Up prüfen
create or replace function public.add_xp(p_player_id uuid, p_amount int, p_source text)
returns table(new_level int, leveled_up bool) language plpgsql security definer as $$
declare
  v_profile  public.profiles%rowtype;
  v_new_xp   int;
  v_leveled  bool := false;
begin
  select * into v_profile from public.profiles where id = p_player_id;

  v_new_xp := v_profile.xp + p_amount;

  -- XP-Log eintragen
  insert into public.xp_log(player_id, source, amount) values(p_player_id, p_source, p_amount);

  -- Level-Up Loop
  while v_new_xp >= v_profile.xp_to_next loop
    v_new_xp        := v_new_xp - v_profile.xp_to_next;
    v_profile.level := v_profile.level + 1;
    v_profile.xp_to_next := floor(v_profile.xp_to_next * 1.25)::int;
    v_leveled := true;
  end loop;

  -- Profil updaten
  update public.profiles
  set xp = v_new_xp, level = v_profile.level, xp_to_next = v_profile.xp_to_next
  where id = p_player_id;

  return query select v_profile.level, v_leveled;
end;
$$;
