-- ============================================================
-- FurniERP — Demo Seed Data (OPTIONAL)
-- Run this AFTER schema.sql if you want sample MOs/JCs to explore
-- the app with realistic data instead of starting empty.
-- ============================================================

-- Manufacturing Orders
insert into manufacturing_orders (mo_number, project_id, client_name, project_type, delivery_date, status)
values
  ('MO-2024-042', 'PRJ042', 'Prestige Interiors', 'Kitchen modular', '2024-06-25', 'In Production'),
  ('MO-2024-043', 'PRJ043', 'Urban Nest Pvt Ltd', 'Wardrobe', '2024-06-30', 'In Production'),
  ('MO-2024-044', 'PRJ044', 'HomeStyle Bengaluru', 'Office furniture', '2024-07-10', 'Procurement');

-- Job Cards for PRJ042
insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance)
select 'PRJ042-JC01', id, 'PRJ042', 'Wall cabinet 900mm', 'DWG-042-01', 'Edge Bander', 'Active', true
from manufacturing_orders where mo_number = 'MO-2024-042';

insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance, qc_cleared)
select 'PRJ042-JC02', id, 'PRJ042', 'Base cabinet 600mm', 'DWG-042-02', 'Dispatched', 'Dispatched', true, true
from manufacturing_orders where mo_number = 'MO-2024-042';

insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance)
select 'PRJ042-JC03', id, 'PRJ042', 'Tall unit 2100mm', 'DWG-042-03', 'QC', 'QC Hold', true
from manufacturing_orders where mo_number = 'MO-2024-042';

insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance)
select 'PRJ042-JC04', id, 'PRJ042', 'Overhead unit 1200mm', 'DWG-042-04', 'Hot Press', 'Active', true
from manufacturing_orders where mo_number = 'MO-2024-042';

-- Job Cards for PRJ043
insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance)
select 'PRJ043-JC01', id, 'PRJ043', 'Base cabinet 600mm', 'DWG-043-01', 'Beam Saw', 'Active', true
from manufacturing_orders where mo_number = 'MO-2024-043';

insert into job_cards (jc_number, mo_id, project_id, product_name, drawing_ref, stage, status, material_clearance)
select 'PRJ043-JC02', id, 'PRJ043', 'Tall unit 2100mm', 'DWG-043-02', 'Stores', 'Stores Hold', false
from manufacturing_orders where mo_number = 'MO-2024-043';

-- BoM for PRJ042-JC01
insert into bom_items (jc_id, material_name, specification, quantity, unit, inward_status, engineer_approved)
select id, 'Pre-lam board', '18mm White Matt both sides', 4, 'Sheet', 'Inwarded', true from job_cards where jc_number = 'PRJ042-JC01'
union all
select id, 'Edge banding tape', 'PVC 22mm White Matt', 20, 'metre', 'Inwarded', true from job_cards where jc_number = 'PRJ042-JC01'
union all
select id, 'Hinge clip', 'Blum Clip Top 110°', 4, 'nos', 'Inwarded', true from job_cards where jc_number = 'PRJ042-JC01'
union all
select id, 'Cam lock', '15mm dia', 12, 'nos', 'Inwarded', true from job_cards where jc_number = 'PRJ042-JC01'
union all
select id, 'PVA adhesive', 'D3 grade', 0.5, 'kg', 'Partial', true from job_cards where jc_number = 'PRJ042-JC01';

-- Vendors already seeded in schema.sql; reference them for POs
insert into purchase_orders (po_number, project_id, jc_id, vendor_id, material_name, quantity, unit, expected_eta, status)
select 'PO-2024-088', 'PRJ042', jc.id, v.id, 'Pre-lam boards 18mm', 20, 'Sheet', '2024-06-12', 'Received'
from job_cards jc, vendors v where jc.jc_number='PRJ042-JC01' and v.name='WoodTech Suppliers';

insert into purchase_orders (po_number, project_id, jc_id, vendor_id, material_name, quantity, unit, expected_eta, status)
select 'PO-2024-089', 'PRJ043', jc.id, v.id, 'Edge banding tape PVC', 150, 'metre', '2024-06-19', 'At Risk'
from job_cards jc, vendors v where jc.jc_number='PRJ043-JC02' and v.name='EdgePro Pvt Ltd';

insert into purchase_orders (po_number, project_id, jc_id, vendor_id, material_name, quantity, unit, expected_eta, status)
select 'PO-2024-091', 'PRJ042', jc.id, v.id, 'PVA adhesive D3', 5, 'kg', '2024-06-15', 'Partial'
from job_cards jc, vendors v where jc.jc_number='PRJ042-JC01' and v.name='AdhesiveTech';

-- NCR for the JC on QC hold
insert into ncr_reports (ncr_number, jc_id, defect_description, severity, status)
select 'NCR-2024-007', id, 'Squareness out of tolerance at Assembly station', 'Major', 'Open'
from job_cards where jc_number = 'PRJ042-JC03';

-- Rework log entries
insert into rework_log (jc_id, station_id, defect_description, panels_affected, escalation_level, status)
select jc.id, s.id, 'Squareness out of tolerance', 2, 'L3', 'Escalated'
from job_cards jc, stations s where jc.jc_number='PRJ042-JC03' and s.name='Assembly';

insert into rework_log (jc_id, station_id, defect_description, panels_affected, escalation_level, status, resolved_at)
select jc.id, s.id, 'Tape adhesion failure on end panel', 1, 'L1', 'Resolved', now()
from job_cards jc, stations s where jc.jc_number='PRJ042-JC01' and s.name='Edge Bander';

-- Update stations with current JC
update stations set status='Busy', current_jc_id=(select id from job_cards where jc_number='PRJ042-JC04') where name='Hot Press';
update stations set status='Busy', current_jc_id=(select id from job_cards where jc_number='PRJ043-JC01') where name='Beam Saw';
update stations set status='Busy', current_jc_id=(select id from job_cards where jc_number='PRJ042-JC01') where name='Edge Bander';

-- Activity feed
insert into activity_log (event_type, description) values
  ('jc_advanced', 'PRJ042-JC01 advanced: Beam Saw → Edge Bander'),
  ('ncr_raised', 'NCR-2024-007 raised on PRJ042-JC03 at Assembly'),
  ('grn_created', 'GRN-2024-043 created for PO-091 (PVA adhesive)'),
  ('dispatched', 'DC-2024-032 dispatched — PRJ040 JC01'),
  ('clearance_granted', 'PRJ043-JC01 material clearance granted by stores');

-- Delivery challans
insert into delivery_challans (challan_number, project_id, jc_ids, driver_name, vehicle_number, dispatch_date, status)
values
  ('DC-2024-031', 'PRJ039', array['PRJ039-JC01','PRJ039-JC02','PRJ039-JC03'], 'Ramesh Kumar', 'KA01-AB-1234', '2024-06-10', 'Delivered'),
  ('DC-2024-032', 'PRJ040', array['PRJ040-JC01'], 'Suresh Naik', 'KA05-CD-5678', '2024-06-12', 'In Transit');

-- ============================================================
-- DONE. Refresh your app — you should now see live demo data.
-- ============================================================
