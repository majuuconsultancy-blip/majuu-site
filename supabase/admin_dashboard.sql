create extension if not exists pgcrypto;

insert into public.landing_metrics (key, value)
values ('site_visits', 0)
on conflict (key) do nothing;

alter table public.waitlist_signups
add column if not exists source text not null default 'updates_section';

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

create table if not exists public.landing_settings (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.landing_settings (key, enabled)
values ('downloads_enabled', false)
on conflict (key) do nothing;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.admin_users (email)
values ('brioneroo@gmail.com')
on conflict (email) do nothing;

delete from public.admin_users
where lower(email) = 'majuuapp@gmail.com';

grant select on public.landing_settings to anon, authenticated;
grant update on public.landing_settings to authenticated;
grant select on public.waitlist_signups to authenticated;
grant select on public.feedback_entries to authenticated;

create or replace view public.waitlist_referral_rankings as
select
  referrers.referral_code,
  referrers.full_name,
  referrers.email,
  count(referrals.id)::int as total_referrals,
  (count(referrals.id) * 10)::int as referral_points
from public.waitlist_signups as referrers
left join public.waitlist_signups as referrals
  on upper(coalesce(referrals.referred_by_code, '')) = upper(referrers.referral_code)
group by referrers.referral_code, referrers.full_name, referrers.email
having count(referrals.id) > 0;

grant select on public.waitlist_referral_rankings to authenticated;

alter table public.landing_settings enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'landing_settings'
      and policyname = 'Public can read downloads setting'
  ) then
    create policy "Public can read downloads setting"
      on public.landing_settings
      for select
      to anon, authenticated
      using (key = 'downloads_enabled');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'landing_settings'
      and policyname = 'Admins can read landing settings'
  ) then
    create policy "Admins can read landing settings"
      on public.landing_settings
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'landing_settings'
      and policyname = 'Admins can update landing settings'
  ) then
    create policy "Admins can update landing settings"
      on public.landing_settings
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist_signups'
      and policyname = 'Admins can read waitlist signups'
  ) then
    create policy "Admins can read waitlist signups"
      on public.waitlist_signups
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_entries'
      and policyname = 'Admins can read feedback entries'
  ) then
    create policy "Admins can read feedback entries"
      on public.feedback_entries
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;
