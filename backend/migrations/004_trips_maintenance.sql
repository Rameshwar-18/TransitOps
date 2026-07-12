-- backend/migrations/004_trips_maintenance.sql

create table trips (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  vehicle_id uuid references vehicles(id) not null,
  driver_id uuid references drivers(id) not null,
  cargo_weight numeric not null,
  planned_distance numeric,
  actual_distance numeric,
  fuel_consumed numeric,
  revenue numeric,
  status text not null default 'Draft'
    check (status in ('Draft','Dispatched','Completed','Cancelled')),
  created_at timestamptz default now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) not null,
  description text not null,
  cost numeric,
  status text not null default 'Open' check (status in ('Open','Closed')),
  date date default now(),
  created_at timestamptz default now()
);
