-- ============================================================
-- FurniERP — Database Schema
-- Modular Furniture Manufacturing — End-to-End Production
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- Clean slate (safe to re-run during setup)
drop table if exists activity_log cascade;
drop table if exists delivery_challans cascade;
drop table if exists ncr_reports cascade;
drop table if exists rework_log cascade;
drop table if exists station_qc_checks cascade;
drop table if exists jc_stage_history cascade;
drop table if exists goods_receipt_notes cascade;
drop table if exists purchase_orders cascade;
drop table if exists bom_items cascade;
drop table if exists job_cards cascade;
drop table if exists manufacturing_orders cascade;
drop table if exists stations cascade;
drop table if exists vendors cascade;

-- ============================================================
-- CORE: Manufacturing Orders & Project ID
-- ============================================================
create table manufacturing_orders (
  id uuid primary key default gen_random_uuid(),
  mo_number text unique not null,           -- e.g. MO-2024-042
  project_id text unique not null,          -- e.g. PRJ042
  client_name text not null,
  project_type text,
  delivery_date date,
  notes text,
  status text not null default 'Draft',     -- Draft, Procurement, In Production, Completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- JOB CARDS — one per product, prefixed with Project ID
-- ============================================================
create table job_cards (
  id uuid primary key default gen_random_uuid(),
  jc_number text unique not null,           -- e.g. PRJ042-JC01
  mo_id uuid references manufacturing_orders(id) on delete cascade,
  project_id text not null,
  product_name text not null,
  drawing_ref text,
  target_completion date,
  revision text default 'R0',
  -- pipeline stage tracking
  stage text not null default 'JC Created',
    -- JC Created, BoM, Procurement, Stores, Hot Press, Beam Saw,
    -- Edge Bander, CNC Drill, Assembly, QC, Packing, Dispatched
  status text not null default 'Active',    -- Active, Stores Hold, QC Hold, Rework, Dispatched
  current_station_id uuid,
  material_clearance boolean default false,
  qc_cleared boolean default false,
  packed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BOM — Bill of Materials per Job Card
-- ============================================================
create table bom_items (
  id uuid primary key default gen_random_uuid(),
  jc_id uuid references job_cards(id) on delete cascade,
  material_name text not null,
  specification text,
  quantity numeric not null,
  unit text,                                -- Sheet, metre, nos, kg
  inward_status text default 'Pending',     -- Pending, Partial, Inwarded, Rejected
  engineer_approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- VENDORS
-- ============================================================
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  approved boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- PROCUREMENT — Purchase Orders
-- ============================================================
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,
  project_id text not null,
  jc_id uuid references job_cards(id) on delete set null,
  bom_item_id uuid references bom_items(id) on delete set null,
  vendor_id uuid references vendors(id),
  material_name text not null,
  quantity numeric,
  unit text,
  expected_eta date,
  status text default 'Pending',            -- Pending, At Risk, Received, Partial
  expedited boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- STORES — Goods Receipt Notes (inward)
-- ============================================================
create table goods_receipt_notes (
  id uuid primary key default gen_random_uuid(),
  grn_number text unique not null,
  po_id uuid references purchase_orders(id) on delete set null,
  received_qty numeric,
  qc_result text default 'Pending',         -- Pass, Partial, Reject
  moisture_content numeric,
  remarks text,
  created_at timestamptz default now()
);

-- ============================================================
-- PRODUCTION FLOOR — Stations (master list)
-- ============================================================
create table stations (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,                -- Hot Press, Beam Saw, Edge Bander, CNC Drill, Assembly
  sequence_order int not null,
  owner_name text,
  status text default 'Idle',               -- Idle, Busy, Breakdown
  current_jc_id uuid references job_cards(id) on delete set null
);

-- ============================================================
-- JC STAGE HISTORY — full audit trail of every move
-- ============================================================
create table jc_stage_history (
  id uuid primary key default gen_random_uuid(),
  jc_id uuid references job_cards(id) on delete cascade,
  from_stage text,
  to_stage text,
  moved_by text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- STATION QC CHECKS — checklist sign-off per station per JC
-- ============================================================
create table station_qc_checks (
  id uuid primary key default gen_random_uuid(),
  jc_id uuid references job_cards(id) on delete cascade,
  station_id uuid references stations(id),
  checklist jsonb,                          -- array of {item, checked}
  result text default 'Pending',            -- Pass, Fail
  inspected_by text,
  created_at timestamptz default now()
);

-- ============================================================
-- REWORK LOG
-- ============================================================
create table rework_log (
  id uuid primary key default gen_random_uuid(),
  jc_id uuid references job_cards(id) on delete cascade,
  station_id uuid references stations(id),
  defect_description text not null,
  panels_affected int,
  escalation_level text default 'L1',       -- L1 Station Owner, L2 Floor Supervisor, L3 Production Manager, L4 QC Head
  status text default 'Open',               -- Open, Resolved, Escalated
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ============================================================
-- NCR — Non-Conformance Reports (Final QC failures)
-- ============================================================
create table ncr_reports (
  id uuid primary key default gen_random_uuid(),
  ncr_number text unique not null,
  jc_id uuid references job_cards(id) on delete cascade,
  defect_description text not null,
  severity text default 'Minor',            -- Minor, Major
  root_cause text,
  corrective_action text,
  status text default 'Open',               -- Open, Closed
  decided_by text,
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- ============================================================
-- DISPATCH — Delivery Challans
-- ============================================================
create table delivery_challans (
  id uuid primary key default gen_random_uuid(),
  challan_number text unique not null,
  project_id text not null,
  jc_ids text[],                            -- array of JC numbers included
  driver_name text,
  vehicle_number text,
  destination text,
  dispatch_date date,
  status text default 'In Transit',         -- In Transit, Delivered
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG — system-wide feed for dashboard
-- ============================================================
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,                 -- mo_created, jc_advanced, ncr_raised, grn_created, dispatched, clearance_granted
  description text not null,
  jc_id uuid references job_cards(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA — stations (fixed 5-station line)
-- ============================================================
insert into stations (name, sequence_order, owner_name, status) values
  ('Hot Press', 1, 'Rajan K.', 'Idle'),
  ('Beam Saw', 2, 'Suresh M.', 'Idle'),
  ('Edge Bander', 3, 'Priya R.', 'Idle'),
  ('CNC Drill', 4, 'Anand P.', 'Idle'),
  ('Assembly', 5, 'Deepak S.', 'Idle');

-- ============================================================
-- SEED DATA — a couple of vendors to get started
-- ============================================================
insert into vendors (name, contact_person, phone, approved) values
  ('WoodTech Suppliers', 'Manoj Shah', '9876543210', true),
  ('EdgePro Pvt Ltd', 'Kiran Joshi', '9876501234', true),
  ('Hardware Hub', 'Ravi Mehta', '9876512345', true),
  ('AdhesiveTech', 'Sunil Rao', '9876523456', true);

-- ============================================================
-- ROW LEVEL SECURITY — open policies for app-key access
-- (Tighten these later if you add user-level auth)
-- ============================================================
alter table manufacturing_orders enable row level security;
alter table job_cards enable row level security;
alter table bom_items enable row level security;
alter table vendors enable row level security;
alter table purchase_orders enable row level security;
alter table goods_receipt_notes enable row level security;
alter table stations enable row level security;
alter table jc_stage_history enable row level security;
alter table station_qc_checks enable row level security;
alter table rework_log enable row level security;
alter table ncr_reports enable row level security;
alter table delivery_challans enable row level security;
alter table activity_log enable row level security;

create policy "Allow all (anon) - manufacturing_orders" on manufacturing_orders for all using (true) with check (true);
create policy "Allow all (anon) - job_cards" on job_cards for all using (true) with check (true);
create policy "Allow all (anon) - bom_items" on bom_items for all using (true) with check (true);
create policy "Allow all (anon) - vendors" on vendors for all using (true) with check (true);
create policy "Allow all (anon) - purchase_orders" on purchase_orders for all using (true) with check (true);
create policy "Allow all (anon) - goods_receipt_notes" on goods_receipt_notes for all using (true) with check (true);
create policy "Allow all (anon) - stations" on stations for all using (true) with check (true);
create policy "Allow all (anon) - jc_stage_history" on jc_stage_history for all using (true) with check (true);
create policy "Allow all (anon) - station_qc_checks" on station_qc_checks for all using (true) with check (true);
create policy "Allow all (anon) - rework_log" on rework_log for all using (true) with check (true);
create policy "Allow all (anon) - ncr_reports" on ncr_reports for all using (true) with check (true);
create policy "Allow all (anon) - delivery_challans" on delivery_challans for all using (true) with check (true);
create policy "Allow all (anon) - activity_log" on activity_log for all using (true) with check (true);

-- ============================================================
-- DONE. Your schema is ready.
-- Next: run seed.sql (optional) to load demo MOs/JCs for testing.
-- ============================================================
