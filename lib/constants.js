// Fixed station sequence — the manufacturing line order
export const STATION_SEQUENCE = [
  'Hot Press',
  'Beam Saw',
  'Edge Bander',
  'CNC Drill',
  'Assembly',
];

// Full JC pipeline stage order (used for progress bars / flow visuals)
export const JC_STAGES = [
  'JC Created',
  'BoM',
  'Procurement',
  'Stores',
  'Hot Press',
  'Beam Saw',
  'Edge Bander',
  'CNC Drill',
  'Assembly',
  'QC',
  'Packing',
  'Dispatched',
];

export function stageIndex(stage) {
  const i = JC_STAGES.indexOf(stage);
  return i === -1 ? 0 : i;
}

export function nextStage(stage) {
  const i = stageIndex(stage);
  return JC_STAGES[Math.min(i + 1, JC_STAGES.length - 1)];
}

// Status -> badge color mapping (Tailwind classes)
export const STATUS_STYLES = {
  Active: 'bg-amber-50 text-amber-700 border-amber-200',
  'Stores Hold': 'bg-red-50 text-red-700 border-red-200',
  'QC Hold': 'bg-red-50 text-red-700 border-red-200',
  Rework: 'bg-red-50 text-red-700 border-red-200',
  Dispatched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-slate-100 text-slate-600 border-slate-200',
  'At Risk': 'bg-red-50 text-red-700 border-red-200',
  Received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-700 border-amber-200',
  Open: 'bg-red-50 text-red-700 border-red-200',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Transit': 'bg-blue-50 text-blue-700 border-blue-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Idle: 'bg-slate-100 text-slate-600 border-slate-200',
  Busy: 'bg-amber-50 text-amber-700 border-amber-200',
  Breakdown: 'bg-red-50 text-red-700 border-red-200',
  Inwarded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Procurement: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Production': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function genNumber(prefix, n) {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

export function genProjectId(seq) {
  return `PRJ${String(seq).padStart(3, '0')}`;
}

export const RACI_DATA = [
  ['MO & Project ID', 'R', 'I', 'I', 'I', 'I', 'I', 'A'],
  ['Job Card creation', 'R', 'I', 'I', 'I', 'C', 'I', 'A'],
  ['BoM creation', 'C', 'I', 'I', 'I', 'I', 'C', 'A'],
  ['Procurement / PO', 'I', 'R', 'C', 'I', 'I', 'I', 'A'],
  ['Material inward & QC', 'I', 'C', 'R', 'I', 'I', 'C', 'A'],
  ['Material clearance', 'I', 'I', 'R', 'I', 'I', 'I', 'A'],
  ['Station production & QC', 'I', 'I', 'I', 'R', 'A', 'C', 'I'],
  ['Rework decision', 'I', 'I', 'I', 'C', 'R', 'C', 'A'],
  ['Escalation handling', 'I', 'I', 'I', 'C', 'R', 'C', 'A'],
  ['Final QC', 'I', 'I', 'I', 'I', 'I', 'R', 'A'],
  ['Packing & dispatch', 'I', 'I', 'R', 'I', 'I', 'C', 'A'],
  ['MO closure', 'R', 'I', 'I', 'I', 'I', 'C', 'A'],
];

export const RACI_ROLES = [
  'Planner', 'Procurement', 'Stores', 'Stn. Owner', 'Floor Supvr', 'QC Head', 'Prod. Mgr',
];

export const DOCS_DATA = [
  { n: 'Manufacturing Order', ph: 'Planning', ow: 'Production Planner' },
  { n: 'Project ID Certificate', ph: 'Planning', ow: 'Production Planner' },
  { n: 'Job Card', ph: 'Planning', ow: 'Production Planner' },
  { n: 'Bill of Materials', ph: 'BoM', ow: 'Production Engineer' },
  { n: 'Purchase Order', ph: 'Procurement', ow: 'Procurement Lead' },
  { n: 'ETA Tracker', ph: 'Procurement', ow: 'Procurement Lead' },
  { n: 'Goods Receipt Note', ph: 'Stores', ow: 'Stores Manager' },
  { n: 'Inward QC Report', ph: 'Stores', ow: 'Stores / QC' },
  { n: 'Material Release Form', ph: 'Stores', ow: 'Stores Manager' },
  { n: 'Station QC Checklist', ph: 'Production', ow: 'Station Owner' },
  { n: 'NCR Form', ph: 'Production / QC', ow: 'Station Owner / QC' },
  { n: 'Rework Register', ph: 'Production', ow: 'Floor Supervisor' },
  { n: 'Downtime Log', ph: 'Production', ow: 'Floor Supervisor' },
  { n: 'Final QC Report', ph: 'Final QC', ow: 'QC Head' },
  { n: 'Packing List', ph: 'Packing', ow: 'Dispatch Supervisor' },
  { n: 'Delivery Challan', ph: 'Dispatch', ow: 'Dispatch Supervisor' },
];

export const STATION_QC_CHECKLIST = {
  'Hot Press': [
    'First piece inspected before batch run',
    'Press temperature within spec (±2°C)',
    'Press pressure within spec (±0.5 bar)',
    'Dwell time met',
    'No bubbles or delamination on surface',
    'No adhesive squeeze-out on edges',
    'Panel dimensions within tolerance (±0.5mm)',
  ],
  'Beam Saw': [
    'Blade condition verified',
    'First-off dimension check completed',
    'Cutting list matches JC drawing',
    'Panel edges free of chipping',
    'All panels tagged with JC number',
  ],
  'Edge Bander': [
    'Tape adhesion strength checked',
    'Flush trim quality verified',
    'Corner finish inspected',
    'Colour match confirmed against sample',
    'First-piece approval recorded',
  ],
  'CNC Drill': [
    'CNC program matches JC drawing reference',
    'Drilling depth verified',
    'Hole spacing checked',
    'First piece test-fitted with hardware',
    'No tear-out at drill points',
  ],
  Assembly: [
    'Hardware installation torque checked',
    'Squareness verified (diagonal measurement)',
    'Door / drawer alignment checked',
    'All fittings functional',
    'Surface free of assembly marks/damage',
  ],
};
