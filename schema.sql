-- ChemSafe / GHS-Lens — Supabase schema
-- Run in Supabase SQL editor. Assumes Supabase Auth is enabled.

create extension if not exists "uuid-ossp";

-- ── Organizations ──────────────────────────────────────────────
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  admin_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ── Profiles (extends auth.users with role + org) ─────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'worker')),
  org_id uuid references organizations(id),
  name text,
  email text,
  created_at timestamptz default now()
);

-- ── Zones ───────────────────────────────────────────────────────
create table zones (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) not null,
  name text not null,
  hazard_types text[] default '{}',
  required_ppe text[] default '{}',
  additional_requirements text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ── Worker <-> Zone assignment (via QR scan) ───────────────────
create table worker_zone_map (
  worker_id uuid references profiles(id),
  zone_id uuid references zones(id),
  assigned_at timestamptz default now(),
  primary key (worker_id, zone_id)
);

-- ── Workplace scans (assessment mode, admin-driven) ────────────
create table workplace_scans (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid references zones(id),
  scanned_by uuid references profiles(id),
  hazard_detected text[] default '{}',
  pubchem_data jsonb,
  created_at timestamptz default now()
);

-- ── Household scans (public, anonymous) ────────────────────────
create table household_scans (
  id uuid primary key default uuid_generate_v4(),
  session_id text,               -- anon browser session, not a user id
  hazard_detected text[] default '{}',
  ocr_text text,
  pubchem_data jsonb,
  created_at timestamptz default now()
);

-- ── PubChem response cache ──────────────────────────────────────
create table pubchem_cache (
  query_text text primary key,
  response_json jsonb,
  cached_at timestamptz default now()
);

-- ── RESERVED for PPE livestream feature (schema ready, unused for now) ──
create table ppe_events (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id),
  zone_id uuid references zones(id),
  detected_ppe jsonb,
  compliance_status text check (compliance_status in ('compliant','violation','resolved')),
  detected_at timestamptz default now(),
  resolved_at timestamptz
);

create table risk_scores (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid references zones(id),
  score int,
  breakdown jsonb,
  computed_at timestamptz default now()
);

-- ── Worker alerts and notifications ──
create table worker_alerts (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id),
  zone_id uuid references zones(id),
  message text not null,
  alert_type text check (alert_type in ('warning', 'danger', 'info')),
  sent_by uuid references profiles(id),
  created_at timestamptz default now(),
  acknowledged_at timestamptz
);

-- ── Worker acknowledgments for safety requirements ──
create table worker_acknowledgments (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id),
  zone_id uuid references zones(id),
  requirements_version text,
  acknowledged_at timestamptz default now()
);

-- ── External camera monitoring stations ──
create table monitoring_stations (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid references zones(id),
  station_name text not null,
  camera_url text,
  stream_key text,
  status text check (status in ('active', 'inactive', 'maintenance')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table zones enable row level security;
alter table worker_zone_map enable row level security;
alter table workplace_scans enable row level security;
alter table household_scans enable row level security;
alter table ppe_events enable row level security;
alter table risk_scores enable row level security;
alter table worker_alerts enable row level security;
alter table worker_acknowledgments enable row level security;
alter table monitoring_stations enable row level security;

create or replace function public.is_admin_in_org(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.org_id = target_org_id
  );
$$;

-- Profiles: users can read/update their own row
create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);
create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);

-- Admins can read every profile in their org
drop policy if exists "profiles_admin_read_org" on profiles;
create policy "profiles_admin_read_org" on profiles
  for select using (public.is_admin_in_org(profiles.org_id));

-- Organizations: allow authenticated admins to create and manage their own org
create policy "organizations_admin_insert" on organizations
  for insert with check (auth.uid() = admin_id);
create policy "organizations_admin_read" on organizations
  for select using (auth.uid() = admin_id);
create policy "organizations_admin_update" on organizations
  for update using (auth.uid() = admin_id);

-- Zones: admins manage zones in their org; workers can read zones they're assigned to
create policy "zones_admin_all" on zones
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.org_id = zones.org_id
    )
  );

create policy "zones_worker_read_assigned" on zones
  for select using (
    exists (
      select 1 from worker_zone_map wzm
      where wzm.zone_id = zones.id and wzm.worker_id = auth.uid()
    )
  );

-- Workplace scans: admin-only within their org
create policy "workplace_scans_admin" on workplace_scans
  for all using (
    exists (
      select 1 from zones z
      join profiles p on p.org_id = z.org_id
      where z.id = workplace_scans.zone_id
        and p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Household scans: public insert (anon), no read policy needed for MVP
-- (writes only, via backend which uses the service key and bypasses RLS anyway)

-- Worker zone map: worker can insert their own assignment (QR scan flow)
create policy "worker_zone_map_self_insert" on worker_zone_map
  for insert with check (worker_id = auth.uid());
create policy "worker_zone_map_self_read" on worker_zone_map
  for select using (worker_id = auth.uid());
