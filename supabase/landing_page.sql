create extension if not exists pgcrypto;

create table if not exists public.landing_metrics (
  key text primary key,
  value bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.landing_metrics (key, value)
values ('apk_downloads', 0)
on conflict (key) do nothing;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null unique,
  phone_number text not null default '',
  referral_code text not null default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  referred_by_code text,
  source text not null default 'updates_section',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.waitlist_signups
add column if not exists full_name text not null default '';

alter table public.waitlist_signups
add column if not exists phone_number text not null default '';

alter table public.waitlist_signups
add column if not exists referral_code text;

update public.waitlist_signups
set referral_code = upper(substr(md5(gen_random_uuid()::text), 1, 8))
where coalesce(referral_code, '') = '';

alter table public.waitlist_signups
alter column referral_code set default upper(substr(md5(gen_random_uuid()::text), 1, 8));

alter table public.waitlist_signups
alter column referral_code set not null;

alter table public.waitlist_signups
add column if not exists referred_by_code text;

alter table public.waitlist_signups
add column if not exists source text not null default 'updates_section';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.waitlist_signups'::regclass
      and conname = 'waitlist_signups_referral_code_key'
  ) then
    alter table public.waitlist_signups
    add constraint waitlist_signups_referral_code_key unique (referral_code);
  end if;
end $$;

create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

grant select on public.landing_metrics to anon, authenticated;
grant insert on public.waitlist_signups to anon, authenticated;
grant insert on public.feedback_entries to anon, authenticated;

alter table public.landing_metrics enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.feedback_entries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'landing_metrics'
      and policyname = 'Public can read landing metrics'
  ) then
    create policy "Public can read landing metrics"
      on public.landing_metrics
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist_signups'
      and policyname = 'Public can insert waitlist signups'
  ) then
    create policy "Public can insert waitlist signups"
      on public.waitlist_signups
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_entries'
      and policyname = 'Public can insert feedback entries'
  ) then
    create policy "Public can insert feedback entries"
      on public.feedback_entries
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

create or replace function public.increment_landing_metric(metric_key text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value bigint;
begin
  update public.landing_metrics
  set value = value + 1,
      updated_at = timezone('utc', now())
  where key = metric_key
  returning value into next_value;

  if next_value is null then
    insert into public.landing_metrics (key, value)
    values (metric_key, 1)
    on conflict (key)
    do update set
      value = public.landing_metrics.value + 1,
      updated_at = timezone('utc', now())
    returning value into next_value;
  end if;

  return next_value;
end;
$$;

grant execute on function public.increment_landing_metric(text) to anon, authenticated;

