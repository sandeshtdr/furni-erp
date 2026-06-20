'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, Textarea, FormRow } from '../../components/FormFields';
import { Flame, Scissors, Layers, Hammer, Puzzle, RotateCw, Package } from 'lucide-react';
import { STATION_QC_CHECKLIST } from '../../lib/constants';

const STATION_ICONS = {
  'Hot Press': Flame,
  'Beam Saw': Scissors,
  'Edge Bander': Layers,
  'CNC Drill': Hammer,
  Assembly: Puzzle,
};

export default function FloorPage() {
  const [stations, setStations] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [rework, setRework] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qcModal, setQcModal] = useState(null); // { jc, station }
  const [checks, setChecks] = useState({});
  const [reworkOpen, setReworkOpen] = useState(false);
  const [reworkForm, setReworkForm] = useState({ jc_id: '', station_id: '', defect_description: '', panels_affected: '', escalation_level: 'L1' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [stData, jcData, rwData] = await Promise.all([
      fetch('/api/stations').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
      fetch('/api/rework').then((r) => r.json()),
    ]);
    setStations(Array.isArray(stData) ? stData : []);
    setJcs(Array.isArray(jcData) ? jcData : []);
    setRework(Array.isArray(rwData) ? rwData : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const onFloorJcs = jcs.filter((j) =>
    ['Hot Press', 'Beam Saw', 'Edge Bander', 'CNC Drill', 'Assembly'].includes(j.stage)
  );

  function openQcModal(jc, stationName) {
    const station = stations.find((s) => s.name === stationName);
    setQcModal({ jc, station });
    const checklist = STATION_QC_CHECKLIST[stationName] || [];
    setChecks(Object.fromEntries(checklist.map((c) => [c, false])));
  }

  async function submitQc(passed) {
    if (!qcModal) return;
    setSaving(true);
    const checklist = Object.entries(checks).map(([item, checked]) => ({ item, checked }));
    await fetch('/api/qc-checks', {
      method: 'POST',
      body: JSON.stringify({
        jc_id: qcModal.jc.id,
        station_id: qcModal.station?.id,
        checklist,
        result: passed ? 'Pass' : 'Fail',
        inspected_by: 'Station Owner',
      }),
    });
    if (passed) {
      await fetch(`/api/jc/${qcModal.jc.id}/advance`, {
        method: 'PATCH',
        body: JSON.stringify({ moved_by: 'Station Owner', notes: 'Station QC passed' }),
      });
    }
    setSaving(false);
    setQcModal(null);
    if (!passed) {
      setReworkForm({ jc_id: qcModal.jc.id, station_id: qcModal.station?.id, defect_description: '', panels_affected: '', escalation_level: 'L1' });
      setReworkOpen(true);
    } else {
      load();
    }
  }

  async function submitRework() {
    if (!reworkForm.jc_id || !reworkForm.defect_description) return;
    setSaving(true);
    await fetch('/api/rework', { method: 'POST', body: JSON.stringify(reworkForm) });
    setSaving(false);
    setReworkOpen(false);
    setReworkForm({ jc_id: '', station_id: '', defect_description: '', panels_affected: '', escalation_level: 'L1' });
    load();
  }

  return (
    <AppShell title="Floor Tracker">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-medium">Production floor — live tracker</div>
          <div className="text-[11px] text-slate-500">All movement on pallets · one JC flows continuously</div>
        </div>
        <Button onClick={() => setReworkOpen(true)}>
          <RotateCw size={14} /> Log rework
        </Button>
      </div>

      <div className="flex items-center gap-2 text-[11px] bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-2 mb-4">
        <Package size={14} className="text-slate-500" />
        All material movement on pallets only · JC flows continuously — no interruption without Floor Supervisor written approval.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
        {stations.map((s) => {
          const Icon = STATION_ICONS[s.name] || Flame;
          const busy = s.status === 'Busy' || !!s.job_cards?.jc_number;
          return (
            <div key={s.id} className={`bg-white border rounded-xl p-3 ${busy ? 'border-amber-200' : 'border-slate-200'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${busy ? 'bg-amber-50' : 'bg-slate-100'}`}>
                <Icon size={18} className={busy ? 'text-amber-600' : 'text-slate-500'} />
              </div>
              <div className="text-[12px] font-medium">{s.name}</div>
              <div className="text-[10px] text-slate-500 mb-1.5">{s.owner_name}</div>
              {busy ? <Badge status="Busy">{s.job_cards?.jc_number || 'Busy'}</Badge> : <Badge status="Idle">Idle</Badge>}
            </div>
          );
        })}
      </div>

      <Card title="JCs currently on floor">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
              <th className="px-2 py-2 border-b border-slate-100">JC No.</th>
              <th className="px-2 py-2 border-b border-slate-100">Product</th>
              <th className="px-2 py-2 border-b border-slate-100">Current station</th>
              <th className="px-2 py-2 border-b border-slate-100">Status</th>
              <th className="px-2 py-2 border-b border-slate-100">Action</th>
            </tr>
          </thead>
          <tbody>
            {onFloorJcs.map((j) => (
              <tr key={j.id}>
                <td className="px-2 py-2 border-b border-slate-100 font-medium">{j.jc_number}</td>
                <td className="px-2 py-2 border-b border-slate-100">{j.product_name}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status="Busy">{j.stage}</Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={j.status}>{j.status}</Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Button size="sm" variant="primary" onClick={() => openQcModal(j, j.stage)}>
                    Log station QC
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && onFloorJcs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-slate-400">
                  No Job Cards currently on the production floor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Rework register">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
              <th className="px-2 py-2 border-b border-slate-100">JC</th>
              <th className="px-2 py-2 border-b border-slate-100">Station</th>
              <th className="px-2 py-2 border-b border-slate-100">Defect</th>
              <th className="px-2 py-2 border-b border-slate-100">Level</th>
              <th className="px-2 py-2 border-b border-slate-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {rework.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 border-b border-slate-100">{r.job_cards?.jc_number}</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.stations?.name}</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.defect_description}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={r.escalation_level === 'L1' ? 'Active' : 'Open'}>
                    {r.escalation_level} —{' '}
                    {{ L1: 'Station Owner', L2: 'Floor Supervisor', L3: 'Production Manager', L4: 'QC Head' }[r.escalation_level]}
                  </Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={r.status === 'Resolved' ? 'Closed' : 'Open'}>{r.status}</Badge>
                </td>
              </tr>
            ))}
            {!loading && rework.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-slate-400">
                  No rework events logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* QC checklist modal */}
      <Modal
        open={!!qcModal}
        onClose={() => setQcModal(null)}
        title={qcModal ? `Station QC checklist — ${qcModal.jc.stage}` : ''}
        footer={
          <>
            <Button onClick={() => setQcModal(null)}>Cancel</Button>
            <Button variant="danger" disabled={saving} onClick={() => submitQc(false)}>
              Fail — log rework
            </Button>
            <Button variant="primary" disabled={saving} onClick={() => submitQc(true)}>
              Pass — advance pallet
            </Button>
          </>
        }
      >
        {qcModal && (
          <div className="flex flex-col gap-0.5">
            {Object.keys(checks).map((c) => (
              <label key={c} className="flex items-center gap-2 py-1.5 border-b border-slate-100 text-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks[c]}
                  onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })}
                />
                {c}
              </label>
            ))}
          </div>
        )}
      </Modal>

      {/* Rework modal */}
      <Modal
        open={reworkOpen}
        onClose={() => setReworkOpen(false)}
        title="Log rework event"
        footer={
          <>
            <Button onClick={() => setReworkOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={saving} onClick={submitRework}>
              {saving ? 'Logging…' : 'Log rework + notify'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="JC number">
            <Select value={reworkForm.jc_id} onChange={(e) => setReworkForm({ ...reworkForm, jc_id: e.target.value })}>
              <option value="">Select JC…</option>
              {jcs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jc_number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Station">
            <Select value={reworkForm.station_id} onChange={(e) => setReworkForm({ ...reworkForm, station_id: e.target.value })}>
              <option value="">Select station…</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Defect description">
          <Textarea
            rows={2}
            placeholder="Describe the defect found…"
            value={reworkForm.defect_description}
            onChange={(e) => setReworkForm({ ...reworkForm, defect_description: e.target.value })}
          />
        </Field>
        <FormRow>
          <Field label="Panels affected">
            <Input
              type="number"
              placeholder="3"
              value={reworkForm.panels_affected}
              onChange={(e) => setReworkForm({ ...reworkForm, panels_affected: e.target.value })}
            />
          </Field>
          <Field label="Escalation level">
            <Select value={reworkForm.escalation_level} onChange={(e) => setReworkForm({ ...reworkForm, escalation_level: e.target.value })}>
              <option value="L1">L1 — Station Owner</option>
              <option value="L2">L2 — Floor Supervisor</option>
              <option value="L3">L3 — Production Manager</option>
              <option value="L4">L4 — QC Head</option>
            </Select>
          </Field>
        </FormRow>
      </Modal>
    </AppShell>
  );
}
