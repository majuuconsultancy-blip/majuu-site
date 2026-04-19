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

do $$
begin
  if to_regclass('public.partners') is not null then
    alter table public.partners
    add column if not exists business_status text;

    alter table public.partners
    add column if not exists home_country text;

    alter table public.partners
    add column if not exists home_countries text[] not null default '{}';
  end if;
end $$;

do $$
begin
  if to_regclass('public.services') is not null then
    alter table public.services
    add column if not exists destination_country text;

    alter table public.services
    add column if not exists required_information text;

    alter table public.services
    add column if not exists tracks text[] not null default '{}';
  end if;
end $$;

do $$
begin
  if to_regclass('public.partners') is not null then
    alter table public.partners enable row level security;
  end if;
  if to_regclass('public.countries') is not null then
    alter table public.countries enable row level security;
  end if;
  if to_regclass('public.country_details') is not null then
    alter table public.country_details enable row level security;
  end if;
  if to_regclass('public.branches') is not null then
    alter table public.branches enable row level security;
  end if;
  if to_regclass('public.services') is not null then
    alter table public.services enable row level security;
  end if;
  if to_regclass('public.admins') is not null then
    alter table public.admins enable row level security;
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
grant delete on public.waitlist_signups to authenticated;
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

create or replace function public.cleanup_referrals_on_waitlist_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.referral_code is not null and old.referral_code <> '' then
    update public.waitlist_signups
    set referred_by_code = null
    where upper(coalesce(referred_by_code, '')) = upper(old.referral_code);
  end if;

  return old;
end;
$$;

drop trigger if exists waitlist_cleanup_referrals_on_delete on public.waitlist_signups;

create trigger waitlist_cleanup_referrals_on_delete
before delete on public.waitlist_signups
for each row
execute function public.cleanup_referrals_on_waitlist_delete();

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
      and tablename = 'waitlist_signups'
      and policyname = 'Admins can delete waitlist signups'
  ) then
    create policy "Admins can delete waitlist signups"
      on public.waitlist_signups
      for delete
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

-- Partner onboarding + admin system
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  business_status text,
  email text not null,
  phone_number text,
  home_country text,
  home_countries text[] not null default '{}',
  website text,
  description text,
  service_tracks text[] not null default '{}',
  proposed_commission numeric(5,2) not null default 0,
  payment_details jsonb not null default '{}'::jsonb,
  operating_hours jsonb not null default '{}'::jsonb,
  agreement_accepted boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.country_details (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null unique references public.countries(id) on delete cascade,
  why_choose_country text,
  top_career_fields text,
  visa_processing_time text,
  total_process_time text,
  visa_acceptance_rate text,
  scholarship_availability_percent text,
  cost_estimate text,
  starting_budget text,
  requirements text,
  notes text,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  branch_name text not null,
  country text,
  city_town text,
  primary_county text,
  secondary_counties text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  destination_country text,
  service_name text not null,
  description text,
  required_information text,
  tracks text[] not null default '{}',
  requirements_json jsonb not null default '{}'::jsonb,
  estimated_processing_time text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  email text not null,
  assigned_branch text,
  stationed_country text,
  city_town text,
  max_requests_capacity integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_email text not null,
  referred_email text not null,
  points integer not null default 10,
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_countries_partner_id on public.countries(partner_id);
create index if not exists idx_branches_partner_id on public.branches(partner_id);
create index if not exists idx_services_partner_id on public.services(partner_id);
create index if not exists idx_admins_partner_id on public.admins(partner_id);
create index if not exists idx_referrals_referrer_email on public.referrals(lower(referrer_email));

grant select, insert on public.partners to anon, authenticated;
grant select, insert on public.countries to anon, authenticated;
grant select, insert on public.country_details to anon, authenticated;
grant select, insert on public.branches to anon, authenticated;
grant select, insert on public.services to anon, authenticated;
grant select, insert on public.admins to anon, authenticated;
grant select on public.referrals to anon, authenticated;

grant update, delete on public.partners to authenticated;
grant update, delete on public.countries to authenticated;
grant update, delete on public.country_details to authenticated;
grant update, delete on public.branches to authenticated;
grant update, delete on public.services to authenticated;
grant update, delete on public.admins to authenticated;
grant insert, update, delete on public.referrals to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partners'
      and policyname = 'Allow public insert'
  ) then
    create policy "Allow public insert"
      on public.partners
      for insert
      to public
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'countries'
      and policyname = 'Allow public insert'
  ) then
    create policy "Allow public insert"
      on public.countries
      for insert
      to public
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'branches'
      and policyname = 'Allow public insert'
  ) then
    create policy "Allow public insert"
      on public.branches
      for insert
      to public
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'Allow public insert'
  ) then
    create policy "Allow public insert"
      on public.services
      for insert
      to public
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admins'
      and policyname = 'Allow public insert'
  ) then
    create policy "Allow public insert"
      on public.admins
      for insert
      to public
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partners'
      and policyname = 'Public can submit partner onboarding'
  ) then
    alter table public.partners enable row level security;

    create policy "Public can submit partner onboarding"
      on public.partners
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view partners"
      on public.partners
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
      and tablename = 'countries'
      and policyname = 'Public can submit countries'
  ) then
    alter table public.countries enable row level security;

    create policy "Public can submit countries"
      on public.countries
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view countries"
      on public.countries
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
      and tablename = 'country_details'
      and policyname = 'Public can submit country details'
  ) then
    alter table public.country_details enable row level security;

    create policy "Public can submit country details"
      on public.country_details
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view country details"
      on public.country_details
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
      and tablename = 'branches'
      and policyname = 'Public can submit branches'
  ) then
    alter table public.branches enable row level security;

    create policy "Public can submit branches"
      on public.branches
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view branches"
      on public.branches
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
      and tablename = 'services'
      and policyname = 'Public can submit services'
  ) then
    alter table public.services enable row level security;

    create policy "Public can submit services"
      on public.services
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view services"
      on public.services
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
      and tablename = 'admins'
      and policyname = 'Public can submit assigned admins'
  ) then
    alter table public.admins enable row level security;

    create policy "Public can submit assigned admins"
      on public.admins
      for insert
      to anon, authenticated
      with check (true);

    create policy "Admins can view assigned admins"
      on public.admins
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
      and tablename = 'referrals'
      and policyname = 'Public can view referrals for lookup'
  ) then
    alter table public.referrals enable row level security;

    create policy "Public can view referrals for lookup"
      on public.referrals
      for select
      to anon, authenticated
      using (true);

    create policy "Authenticated can create referrals"
      on public.referrals
      for insert
      to authenticated
      with check (true);

    create policy "Admins can manage referrals"
      on public.referrals
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

