'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import {
  AlertTriangle, Clock, CheckCircle2, FileCheck, Truck, LockOpen, Flame, Scissors, Layers, Hammer, Puzzle,
  ListChecks, ShoppingCart, Warehouse,
} from 'lucide-react';

const STATION_ICONS = {
  'Hot Press': Flame,
  'Beam Saw': Scissors,
  'Edge Bander': Layers,
  'CNC Drill': Hammer,
  Assembly: Puzzle,
};

const PRE_FLOOR_STAGES = [
  { stage: 'BoM', label: 'Bill of Materials', icon: ListChecks },
  { stage: 'Procurement', label: 'Procurement', icon: ShoppingCart },
  { stage: 'Stores', label: 'Stores', icon: Warehouse },
];

const EVENT_ICONS = {
  jc_advanced: CheckCircle2,
  ncr_raised: AlertTriangle,
  grn_created: FileCheck,
  dispatched: Truck,
  clearance_granted: LockOpen,
  mo_created: FileCheck,
  jc_created: FileCheck,
  po_raised: FileCheck,
  rework_logged: AlertTriangle,
};

export default function DashboardPage() {
  const [jcs, setJcs] = useState([]);
  const [stations, setStations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pos, setPos] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jcRes, stRes, actRes, poRes, ncrRes] = await Promise.all([
          fetch('/api/jc').then((r) => r.json()),
          fetch('/api/stations').then((r) => r.json()),
          fetch('/api/activity').then((r) => r.json()),
          fetch('/api/po').then((r) => r.json()),
          fetch('/api/ncr').then((r) => r.json()),
        ]);
        setJcs(Array.isArray(jcRes) ? jcRes : []);
        setStations(Array.isArray(stRes) ? stRes : []);
        setActivity(Array.isArray(actRes) ? actRes : []);
        setPos(Array.isArray(poRes) ? poRes : []);
        setNcrs(Array.isArray(ncrRes) ? ncrRes : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeJcs = jcs.filter((j) => j.status !== 'Dispatched');
  const dispatchedCount = jcs.filter((j) => j.status === 'Dispatched').length;
  const qcHolds = jcs.filter((j) => j.status === 'QC Hold').length;
  const openNcrs = ncrs.filter((n) => n.status === 'Open');
  const atRiskPos = pos.filter((p) => p.status === 'At Risk');

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <div className="text-sm text-slate-400 py-10 text-center">Loading dashboard…</div>
      ) : (
        <>
          {openNcrs.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] mb-2.5"
            >
              <AlertTriangle size={16} />
              <span>
                <strong>{n.job_cards?.jc_number}</strong> — {n.defect_description}. NCR open, awaiting decision.
              </span>
            </div>
          ))}
          {atRiskPos.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[12px] mb-2.5"
            >
              <Clock size={16} />
              <span>
                <strong>{p.po_number}</strong> — {p.material_name} ETA at risk. Expedite needed.
              </span>
            </div>
          ))}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 mt-3">
            <StatCard label="Active MOs" value={new Set(jcs.map((j) => j.project_id)).size} color="text-blue-600" />
            <StatCard label="Job Cards in flight" value={activeJcs.length} color="text-amber-600" />
            <StatCard label="QC Holds" value={qcHolds} color="text-red-600" />
            <StatCard label="Dispatched" value={dispatchedCount} color="text-emerald-600" />
            <StatCard label="POs at risk" value={atRiskPos.length} color="text-amber-600" />
            <StatCard label="Open NCRs" value={openNcrs.length} color="text-red-600" />
          </div>

          <div className="grid lg:grid-cols-2 gap-3.5">
            <Card title="Active job cards" subtitle="Current stage per JC">
              <div className="divide-y divide-slate-100">
                {jcs.slice(0, 6).map((j) => (
                  <div key={j.id} className="flex items-center gap-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate">{j.jc_number}</div>
                      <div className="text-[11px] text-slate-500 truncate">{j.product_name}</div>
                    </div>
                    <Badge status={j.status}>{j.status}</Badge>
                    <span className="text-[11px] text-slate-500 w-24 text-right truncate">{j.stage}</span>
                  </div>
                ))}
                {jcs.length === 0 && <div className="text-[12px] text-slate-400 py-3">No job cards yet.</div>}
              </div>
            </Card>

            <Card title="Recent activity">
              <div className="flex flex-col">
                {activity.map((a, i) => {
                  const Icon = EVENT_ICONS[a.event_type] || CheckCircle2;
                  return (
                    <div key={a.id} className="flex gap-3 py-2 relative">
                      {i < activity.length - 1 && (
                        <div className="absolute left-[13px] top-[30px] w-0.5 bg-slate-100" style={{ height: 'calc(100% - 10px)' }} />
                      )}
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={13} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="text-[12px]">{a.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activity.length === 0 && <div className="text-[12px] text-slate-400 py-3">No recent activity.</div>}
              </div>
            </Card>
          </div>

          <Card title="Pre-production pipeline" subtitle="Job Cards in BoM, Procurement & Stores">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRE_FLOOR_STAGES.map(({ stage, label, icon: Icon }) => {
                const jcsAtStage = jcs.filter((j) => j.stage === stage);
                const hasJcs = jcsAtStage.length > 0;
                return (
                  <div
                    key={stage}
                    className={`bg-white border rounded-xl p-3 ${hasJcs ? 'border-blue-200' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasJcs ? 'bg-blue-50' : 'bg-slate-100'}`}>
                        <Icon size={16} className={hasJcs ? 'text-blue-600' : 'text-slate-500'} />
                      </div>
                      <div>
                        <div className="text-[12px] font-medium">{label}</div>
                        <div className="text-[10px] text-slate-500">{jcsAtStage.length} JC{jcsAtStage.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {hasJcs ? (
                      <div className="flex flex-col gap-1">
                        {jcsAtStage.map((j) => (
                          <div key={j.id} className="flex items-center justify-between gap-2">
                            <span className="text-[11px] truncate">{j.jc_number}</span>
                            <Badge status={j.status}>{j.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">None currently</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Production floor status" subtitle="All 5 stations — live view">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {stations.map((s) => {
                const Icon = STATION_ICONS[s.name] || Flame;
                const jcsAtStation = jcs.filter((j) => j.stage === s.name);
                const busy = jcsAtStation.length > 0;
                return (
                  <div
                    key={s.id}
                    className={`bg-white border rounded-xl p-3 ${busy ? 'border-amber-200' : 'border-slate-200'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${busy ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      <Icon size={18} className={busy ? 'text-amber-600' : 'text-slate-500'} />
                    </div>
                    <div className="text-[12px] font-medium mb-0.5">{s.name}</div>
                    <div className="text-[10px] text-slate-500 mb-1.5">{s.owner_name}</div>
                    {busy ? (
                      <div className="flex flex-col gap-1">
                        {jcsAtStation.map((j) => (
                          <Badge key={j.id} status="Busy">
                            {j.jc_number}
                          </Badge>
                        ))}
                        {jcsAtStation.length > 1 && (
                          <span className="text-[10px] text-slate-400 mt-0.5">{jcsAtStation.length} JCs queued</span>
                        )}
                      </div>
                    ) : (
                      <Badge status="Idle">Idle</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className={`text-2xl font-medium ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
