-- Accounts use a nickname and a password, no e-mail: children do not have to share contact data.
-- All tables are closed to the public API; the app talks to the database only through the cc_* functions.
-- The admin code is stored separately as a SHA-256 hash in app_secrets (name = 'admin_code') and is not part of this file.

create extension if not exists pgcrypto with schema extensions;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 3 and 24),
  nickname_key text not null unique,
  password_hash text not null,
  grade smallint check (grade between 7 and 11),
  lang text check (lang in ('kk', 'ru', 'en')),
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  failed_logins int not null default 0,
  locked_until timestamptz
);

create table public.sessions (
  token_hash text primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessions_account_idx on public.sessions (account_id);

create table public.progress (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  discoveries jsonb not null default '[]'::jsonb,
  journal jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.visits (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  lang text,
  grade smallint,
  device text,
  referrer text
);
create index visits_created_idx on public.visits (created_at);
create index visits_visitor_idx on public.visits (visitor_id, created_at);

create table public.experiments (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  reaction text not null,
  kind text not null,
  grade smallint
);
create index experiments_created_idx on public.experiments (created_at);
create index experiments_visitor_idx on public.experiments (visitor_id, created_at);

create table public.app_secrets (
  name text primary key,
  value_hash text not null
);

alter table public.accounts enable row level security;
alter table public.sessions enable row level security;
alter table public.progress enable row level security;
alter table public.visits enable row level security;
alter table public.experiments enable row level security;
alter table public.app_secrets enable row level security;

revoke all on public.accounts, public.sessions, public.progress, public.visits, public.experiments, public.app_secrets from anon, authenticated;

-- ---------------------------------------------------------------- helpers (not callable from the API)

create or replace function public.cc_hash(p text) returns text
language sql immutable set search_path = public, extensions
as $$ select encode(extensions.digest(p, 'sha256'), 'hex') $$;

create or replace function public.cc_session_for(p_account uuid) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from public.sessions where account_id = p_account and expires_at < now();
  insert into public.sessions (token_hash, account_id, expires_at)
  values (public.cc_hash(v_token), p_account, now() + interval '60 days');
  return v_token;
end $$;

create or replace function public.cc_account(p_token text) returns public.accounts
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts;
begin
  if p_token is null or char_length(p_token) <> 64 then return null; end if;
  select a.* into v
  from public.sessions s join public.accounts a on a.id = s.account_id
  where s.token_hash = public.cc_hash(p_token) and s.expires_at > now();
  if v.id is not null and v.last_seen_at < now() - interval '5 minutes' then
    update public.accounts set last_seen_at = now() where id = v.id;
  end if;
  return v;
end $$;

create or replace function public.cc_public(v public.accounts) returns json
language sql stable set search_path = public
as $$ select json_build_object('id', v.id, 'nickname', v.nickname, 'grade', v.grade, 'lang', v.lang, 'role', v.role, 'createdAt', v.created_at) $$;

revoke execute on function public.cc_hash(text), public.cc_session_for(uuid), public.cc_account(text), public.cc_public(public.accounts) from public, anon, authenticated;

-- ---------------------------------------------------------------- accounts

create or replace function public.cc_register(p_nickname text, p_password text, p_grade int default null, p_lang text default null)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_nick text := btrim(coalesce(p_nickname, ''));
  v public.accounts;
begin
  if char_length(v_nick) < 3 or char_length(v_nick) > 24 or v_nick ~ '[<>@/\\\s]{2,}|[<>@/\\]' then
    return json_build_object('error', 'nickname');
  end if;
  if p_password is null or char_length(p_password) < 6 or char_length(p_password) > 72 then
    return json_build_object('error', 'password');
  end if;
  if exists (select 1 from public.accounts where nickname_key = lower(v_nick)) then
    return json_build_object('error', 'taken');
  end if;
  insert into public.accounts (nickname, nickname_key, password_hash, grade, lang)
  values (v_nick, lower(v_nick), extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
          case when p_grade between 7 and 11 then p_grade end,
          case when p_lang in ('kk', 'ru', 'en') then p_lang end)
  returning * into v;
  insert into public.progress (account_id) values (v.id);
  return json_build_object('token', public.cc_session_for(v.id), 'account', public.cc_public(v));
end $$;

create or replace function public.cc_login(p_nickname text, p_password text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts;
begin
  select * into v from public.accounts where nickname_key = lower(btrim(coalesce(p_nickname, '')));
  if v.id is null then
    perform pg_sleep(0.3);
    return json_build_object('error', 'wrong');
  end if;
  if v.locked_until is not null and v.locked_until > now() then
    return json_build_object('error', 'locked');
  end if;
  if v.password_hash <> extensions.crypt(coalesce(p_password, ''), v.password_hash) then
    update public.accounts
    set failed_logins = failed_logins + 1,
        locked_until = case when failed_logins + 1 >= 8 then now() + interval '10 minutes' end
    where id = v.id;
    return json_build_object('error', 'wrong');
  end if;
  update public.accounts set failed_logins = 0, locked_until = null, last_seen_at = now() where id = v.id;
  return json_build_object('token', public.cc_session_for(v.id), 'account', public.cc_public(v));
end $$;

create or replace function public.cc_logout(p_token text) returns json
language plpgsql security definer set search_path = public, extensions
as $$
begin
  delete from public.sessions where token_hash = public.cc_hash(coalesce(p_token, ''));
  return json_build_object('ok', true);
end $$;

create or replace function public.cc_me(p_token text) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
  p public.progress;
begin
  if v.id is null then return json_build_object('error', 'auth'); end if;
  select * into p from public.progress where account_id = v.id;
  return json_build_object('account', public.cc_public(v),
    'progress', json_build_object('discoveries', coalesce(p.discoveries, '[]'::jsonb), 'journal', coalesce(p.journal, '[]'::jsonb)));
end $$;

create or replace function public.cc_update_profile(p_token text, p_grade int, p_lang text) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
begin
  if v.id is null then return json_build_object('error', 'auth'); end if;
  update public.accounts
  set grade = case when p_grade between 7 and 11 then p_grade else grade end,
      lang = case when p_lang in ('kk', 'ru', 'en') then p_lang else lang end
  where id = v.id returning * into v;
  return json_build_object('account', public.cc_public(v));
end $$;

create or replace function public.cc_save_progress(p_token text, p_discoveries jsonb, p_journal jsonb) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
begin
  if v.id is null then return json_build_object('error', 'auth'); end if;
  if jsonb_typeof(p_discoveries) <> 'array' or jsonb_typeof(p_journal) <> 'array'
     or octet_length(p_discoveries::text) > 50000 or octet_length(p_journal::text) > 400000 then
    return json_build_object('error', 'size');
  end if;
  insert into public.progress (account_id, discoveries, journal, updated_at)
  values (v.id, p_discoveries, p_journal, now())
  on conflict (account_id) do update set discoveries = excluded.discoveries, journal = excluded.journal, updated_at = now();
  return json_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- analytics

create or replace function public.cc_track_visit(p_visitor uuid, p_token text, p_lang text, p_grade int, p_device text, p_referrer text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
begin
  if p_visitor is null then return json_build_object('error', 'visitor'); end if;
  -- One visit per visitor per 30 minutes.
  if exists (select 1 from public.visits where visitor_id = p_visitor and created_at > now() - interval '30 minutes') then
    return json_build_object('ok', true, 'counted', false);
  end if;
  insert into public.visits (visitor_id, account_id, lang, grade, device, referrer)
  values (p_visitor, v.id,
          case when p_lang in ('kk', 'ru', 'en') then p_lang end,
          case when p_grade between 7 and 11 then p_grade end,
          case when p_device in ('phone', 'tablet', 'desktop') then p_device end,
          left(p_referrer, 120));
  return json_build_object('ok', true, 'counted', true);
end $$;

create or replace function public.cc_track_experiment(p_visitor uuid, p_token text, p_reaction text, p_kind text, p_grade int)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
begin
  if p_visitor is null or p_reaction is null or p_kind is null then return json_build_object('error', 'input'); end if;
  if (select count(*) from public.experiments where visitor_id = p_visitor and created_at > now() - interval '1 hour') >= 300 then
    return json_build_object('ok', true, 'counted', false);
  end if;
  insert into public.experiments (visitor_id, account_id, reaction, kind, grade)
  values (p_visitor, v.id, left(p_reaction, 80), left(p_kind, 40), case when p_grade between 7 and 11 then p_grade end);
  return json_build_object('ok', true, 'counted', true);
end $$;

-- ---------------------------------------------------------------- admin

create or replace function public.cc_claim_admin(p_token text, p_code text) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
  v_hash text;
begin
  if v.id is null then return json_build_object('error', 'auth'); end if;
  select value_hash into v_hash from public.app_secrets where name = 'admin_code';
  if v_hash is null or public.cc_hash(btrim(coalesce(p_code, ''))) <> v_hash then
    perform pg_sleep(0.5);
    return json_build_object('error', 'code');
  end if;
  update public.accounts set role = 'admin' where id = v.id returning * into v;
  return json_build_object('account', public.cc_public(v));
end $$;

create or replace function public.cc_admin_stats(p_token text, p_days int default 30) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
  v_days int := least(greatest(coalesce(p_days, 30), 1), 365);
  v_from timestamptz := date_trunc('day', now()) - make_interval(days => v_days - 1);
begin
  if v.id is null or v.role <> 'admin' then return json_build_object('error', 'forbidden'); end if;
  return json_build_object(
    'days', v_days,
    'totals', json_build_object(
      'visits', (select count(*) from public.visits where created_at >= v_from),
      'visitors', (select count(distinct visitor_id) from public.visits where created_at >= v_from),
      'visitsToday', (select count(*) from public.visits where created_at >= date_trunc('day', now())),
      'visitorsToday', (select count(distinct visitor_id) from public.visits where created_at >= date_trunc('day', now())),
      'accounts', (select count(*) from public.accounts),
      'newAccounts', (select count(*) from public.accounts where created_at >= v_from),
      'activeAccounts', (select count(*) from public.accounts where last_seen_at >= now() - interval '7 days'),
      'experiments', (select count(*) from public.experiments where created_at >= v_from)
    ),
    'daily', (
      select coalesce(json_agg(json_build_object(
        'day', to_char(d, 'YYYY-MM-DD'),
        'visits', (select count(*) from public.visits where created_at >= d and created_at < d + interval '1 day'),
        'visitors', (select count(distinct visitor_id) from public.visits where created_at >= d and created_at < d + interval '1 day'),
        'experiments', (select count(*) from public.experiments where created_at >= d and created_at < d + interval '1 day'),
        'signups', (select count(*) from public.accounts where created_at >= d and created_at < d + interval '1 day')
      ) order by d), '[]'::json)
      from generate_series(v_from, date_trunc('day', now()), interval '1 day') d
    ),
    'devices', (select coalesce(json_object_agg(k, n), '{}'::json) from (select coalesce(device, 'unknown') k, count(*) n from public.visits where created_at >= v_from group by 1) t),
    'langs', (select coalesce(json_object_agg(k, n), '{}'::json) from (select coalesce(lang, 'unknown') k, count(*) n from public.visits where created_at >= v_from group by 1) t),
    'grades', (select coalesce(json_object_agg(k, n), '{}'::json) from (select coalesce(grade::text, 'unknown') k, count(*) n from public.visits where created_at >= v_from group by 1) t),
    'topReactions', (select coalesce(json_agg(json_build_object('reaction', reaction, 'kind', kind, 'count', n) order by n desc), '[]'::json)
                     from (select reaction, min(kind) kind, count(*) n from public.experiments where created_at >= v_from group by reaction order by n desc limit 15) t),
    'accounts', (select coalesce(json_agg(json_build_object(
                    'id', a.id, 'nickname', a.nickname, 'grade', a.grade, 'role', a.role, 'createdAt', a.created_at, 'lastSeenAt', a.last_seen_at,
                    'experiments', (select count(*) from public.experiments e where e.account_id = a.id),
                    'discoveries', (select coalesce(jsonb_array_length(p.discoveries), 0) from public.progress p where p.account_id = a.id)
                  ) order by a.last_seen_at desc), '[]'::json)
                 from (select * from public.accounts order by last_seen_at desc limit 200) a)
  );
end $$;

create or replace function public.cc_admin_set_role(p_token text, p_account uuid, p_role text) returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v public.accounts := public.cc_account(p_token);
begin
  if v.id is null or v.role <> 'admin' then return json_build_object('error', 'forbidden'); end if;
  if p_role not in ('student', 'teacher', 'admin') then return json_build_object('error', 'role'); end if;
  if p_account = v.id and p_role <> 'admin' then return json_build_object('error', 'self'); end if;
  update public.accounts set role = p_role where id = p_account;
  return json_build_object('ok', true);
end $$;

revoke execute on all functions in schema public from public;
grant execute on function
  public.cc_register(text, text, int, text),
  public.cc_login(text, text),
  public.cc_logout(text),
  public.cc_me(text),
  public.cc_update_profile(text, int, text),
  public.cc_save_progress(text, jsonb, jsonb),
  public.cc_track_visit(uuid, text, text, int, text, text),
  public.cc_track_experiment(uuid, text, text, text, int),
  public.cc_claim_admin(text, text),
  public.cc_admin_stats(text, int),
  public.cc_admin_set_role(text, uuid, text)
to anon, authenticated;
