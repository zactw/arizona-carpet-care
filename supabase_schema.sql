-- Arizona Carpet Care — Supabase Schema
-- Run this in your Supabase SQL editor

-- Crew members (hardcoded in app for MVP, but table for future)
create table crew_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Seed crew members
insert into crew_members (name) values
  ('Aaron F'),
  ('Miguel R'),
  ('Carlos M'),
  ('Jose L'),
  ('David T'),
  ('Marco S'),
  ('Luis G'),
  ('Chris P');

-- Properties
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text,
  property_manager_name text,
  property_manager_phone text,
  maintenance_supervisor_name text,
  maintenance_supervisor_phone text,
  management_company text,
  unit_count integer,
  standing_directions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs
create table jobs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  crew_member_id uuid references crew_members(id),
  crew_name text not null, -- denormalized for simplicity
  job_date date not null,
  start_time time not null,
  end_time time not null,
  comments text,
  status text default 'scheduled' check (status in ('scheduled','in_progress','complete','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index jobs_date_idx on jobs(job_date);
create index jobs_crew_idx on jobs(crew_name);

-- Enable Row Level Security (optional — configure policies as needed)
-- alter table properties enable row level security;
-- alter table jobs enable row level security;
-- alter table crew_members enable row level security;
