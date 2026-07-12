-- backend/migrations/005_fuel_expenses.sql

create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) not null,
  trip_id uuid references trips(id),
  liters numeric not null check (liters > 0),
  cost numeric not null check (cost > 0),
  date date default now(),
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  vehicle_id uuid references vehicles(id) not null,
  toll numeric default 0,
  other numeric default 0,
  date date default now(),
  created_at timestamptz default now()
);
