'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, FormRow } from '../../components/FormFields';
import { Plus, ArrowRight } from 'lucide-react';
import { STATION_SEQUENCE } from '../../lib/constants';

// Display-only stage list for the Job Cards page: everything from the first
// machine station through final dispatch is collapsed into a single
// "Production" step. Advancing through those stages happens on the Floor
// Tracker (and QC / Dispatch pages) instead — this page stops at Stores.
const DISPLAY_STAGES = ['JC Created', 'BoM', 'Procurement', 'Stores', 'Production'];

// Real stages that all collapse into the single "Production" display box
const PRODUCTION_COLLAPSED_STAGES = [...STATION_SEQUENCE, 'QC', 'Packing', 'Dispatched'];

function displayStageIndex(stage) {
  if (PRODUCTION_COLLAPSED_STAGES.includes(stage)) return DISPLAY_STAGES.indexOf('Production');
  const i = DISPLAY_STAGES.indexOf(stage);
  return i === -1 ? 0 : i;
}

export default function JCPage() {
  const [jcs, setJcs] = useState([]);
  const [mos, setMos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [form, setForm] = useState({ mo_id: '', project_id: '', product_name: '', drawing_ref: '', target_completion: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [jcData, moData] = await Promise.all([
      fetch('/api/jc').then((r) => r.json()),
      fetch('/api/mo').then((r) => r.json()),
    ]);
    setJcs(Array.isArray(jcData) ? jcData : []);
    setMos(Array.isArray(moData) ? moData : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createJC() {
    if (!form.mo_id || !form.product_name) return;
    setSaving(true);
    await fetch('/api/jc', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    setOpen(false);
    setForm({ mo_id: '', project_id: '', product_name: '', drawing_ref: '', target_completion: '' });
    load();
  }

  async function advanceJC() {
    if (!advanceTarget) return;
    setSaving(true);
    await fetch(`/api/jc/${advanceTarget.id}/advance`, {
      method: 'PATCH',
      body: JSON.stringify({ moved_by: 'Production Manager' }),
    });
    setSaving(false);
    setAdvanceTarget(null);
    load();
  }

  const filtered = filter === 'all' ? jcs : jcs.filter((j) => j.status === filter);

  return (
    <AppShell title="Job Cards">
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div>
          <div className="text-[13px] font-medium">Job Cards</div>
          <div className="text-[11px] text-slate-500">
            One per product — advance through BoM / Procurement / Stores here; once on the floor, use Floor Tracker
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Stores Hold">Stores Hold</option>
            <option value="QC Hold">QC Hold</option>
            <option value="Rework">Rework</option>
            <option value="Dispatched">Dispatched</option>
          </select>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus size={14} /> New JC
          </Button>
        </div>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-4 py-2.5 border-b border-slate-100">JC No.</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Product</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Project</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Stage flow</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Status</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => {
                const idx = displayStageIndex(j.stage);
                return (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 border-b border-slate-100 font-medium whitespace-nowrap">{j.jc_number}</td>
                    <td className="px-4 py-2.5 border-b border-slate-100 whitespace-nowrap">{j.product_name}</td>
                    <td className="px-4 py-2.5 border-b border-slate-100">
                      <Badge>{j.project_id}</Badge>
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-0.5 overflow-x-auto max-w-[420px] scrollbar-thin">
                        {DISPLAY_STAGES.map((s, i) => (
                          <div key={s} className="flex items-center flex-shrink-0">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                j.status === 'Dispatched' || i < idx
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : i === idx
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              {s}
                            </span>
                            {i < DISPLAY_STAGES.length - 1 && <ArrowRight size={9} className="text-slate-300 mx-0.5" />}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-100">
                      <Badge status={j.status}>{j.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-100">
                      {PRODUCTION_COLLAPSED_STAGES.includes(j.stage) || j.status === 'Dispatched' ? (
                        <span
                          className="text-[11px] text-slate-400 italic"
                          title="Once a JC reaches the production floor, advance it from the Floor Tracker page instead."
                        >
                          {j.status === 'Dispatched' ? 'Dispatched' : 'Use Floor Tracker'}
                        </span>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => setAdvanceTarget(j)}>
                          Advance <ArrowRight size={12} />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No job cards match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New JC modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Job Card"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={createJC}>
              {saving ? 'Generating…' : 'Generate JC'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="Manufacturing Order">
            <Select
              value={form.mo_id}
              onChange={(e) => {
                const mo = mos.find((m) => m.id === e.target.value);
                setForm({ ...form, mo_id: e.target.value, project_id: mo?.project_id || '' });
              }}
            >
              <option value="">Select MO…</option>
              {mos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mo_number} ({m.project_id})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Product name">
            <Input
              placeholder="e.g. Wall cabinet 900mm"
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Drawing reference">
            <Input placeholder="DWG-042-07" value={form.drawing_ref} onChange={(e) => setForm({ ...form, drawing_ref: e.target.value })} />
          </Field>
          <Field label="Target completion">
            <Input type="date" value={form.target_completion} onChange={(e) => setForm({ ...form, target_completion: e.target.value })} />
          </Field>
        </FormRow>
        {form.project_id && (
          <div className="text-[11px] bg-blue-50 text-blue-700 rounded-lg p-2.5">
            JC number will be auto-generated with Project ID prefix, e.g. <strong>{form.project_id}-JC01</strong>
          </div>
        )}
      </Modal>

      {/* Advance modal */}
      <Modal
        open={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        title="Advance JC to next stage"
        footer={
          <>
            <Button onClick={() => setAdvanceTarget(null)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={advanceJC}>
              {saving ? 'Confirming…' : 'Confirm & advance pallet'}
            </Button>
          </>
        }
      >
        {advanceTarget && (
          <>
            <div className="text-[11px] bg-amber-50 text-amber-700 rounded-lg p-2.5 mb-3">
              Confirm station QC passed before advancing the pallet.
            </div>
            <FormRow>
              <Field label="JC">
                <Input value={advanceTarget.jc_number} readOnly />
              </Field>
              <Field label="Current stage">
                <Input value={advanceTarget.stage} readOnly />
              </Field>
            </FormRow>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
