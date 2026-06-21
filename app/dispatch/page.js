'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, FormRow } from '../../components/FormFields';
import { Plus, ClipboardCheck, Package, Truck } from 'lucide-react';

const POST_FLOOR_STAGES = [
  { stage: 'QC', label: 'Quality Control', icon: ClipboardCheck },
  { stage: 'Packing', label: 'Packing', icon: Package },
  { stage: 'Dispatched', label: 'Dispatched', icon: Truck },
];

export default function DispatchPage() {
  const [challans, setChallans] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ project_id: '', jc_ids: '', driver_name: '', vehicle_number: '', destination: '', dispatch_date: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [chData, jcData] = await Promise.all([
      fetch('/api/dispatch').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
    ]);
    setChallans(Array.isArray(chData) ? chData : []);
    setJcs(Array.isArray(jcData) ? jcData : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const readyJcs = jcs.filter((j) => j.stage === 'Packing' || j.stage === 'QC');
  const dispatchedJcs = jcs.filter((j) => j.status === 'Dispatched');

  async function createChallan() {
    if (!form.project_id || !form.jc_ids) return;
    setSaving(true);
    await fetch('/api/dispatch', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        jc_ids: form.jc_ids.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ project_id: '', jc_ids: '', driver_name: '', vehicle_number: '', destination: '', dispatch_date: '' });
    load();
  }

  return (
    <AppShell title="Dispatch">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-medium">Dispatch</div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={14} /> Create Challan
        </Button>
      </div>

      <Card title="QC, packing & dispatch pipeline" subtitle="Job Cards in QC, Packing & Dispatched">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {POST_FLOOR_STAGES.map(({ stage, label, icon: Icon }) => {
            const jcsAtStage = jcs.filter((j) => (stage === 'Dispatched' ? j.status === 'Dispatched' : j.stage === stage));
            const hasJcs = jcsAtStage.length > 0;
            return (
              <div key={stage} className={`bg-white border rounded-xl p-3 ${hasJcs ? 'border-blue-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasJcs ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <Icon size={16} className={hasJcs ? 'text-blue-600' : 'text-slate-500'} />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium">{label}</div>
                    <div className="text-[10px] text-slate-500">
                      {jcsAtStage.length} JC{jcsAtStage.length !== 1 ? 's' : ''}
                    </div>
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

      <Card title="Ready for dispatch">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
              <th className="px-2 py-2 border-b border-slate-100">JC No.</th>
              <th className="px-2 py-2 border-b border-slate-100">Project</th>
              <th className="px-2 py-2 border-b border-slate-100">Product</th>
              <th className="px-2 py-2 border-b border-slate-100">QC</th>
              <th className="px-2 py-2 border-b border-slate-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {readyJcs.map((j) => (
              <tr key={j.id}>
                <td className="px-2 py-2 border-b border-slate-100 font-medium">{j.jc_number}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge>{j.project_id}</Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">{j.product_name}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={j.status === 'QC Hold' ? 'Open' : 'Received'}>{j.status === 'QC Hold' ? 'On Hold' : 'Cleared'}</Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={j.status}>{j.status}</Badge>
                </td>
              </tr>
            ))}
            {!loading && readyJcs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-slate-400">
                  No Job Cards ready for dispatch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Dispatched">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
              <th className="px-2 py-2 border-b border-slate-100">Challan No.</th>
              <th className="px-2 py-2 border-b border-slate-100">Project</th>
              <th className="px-2 py-2 border-b border-slate-100">JCs</th>
              <th className="px-2 py-2 border-b border-slate-100">Date</th>
              <th className="px-2 py-2 border-b border-slate-100">Driver</th>
              <th className="px-2 py-2 border-b border-slate-100">Vehicle</th>
              <th className="px-2 py-2 border-b border-slate-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((c) => (
              <tr key={c.id}>
                <td className="px-2 py-2 border-b border-slate-100 font-medium">{c.challan_number}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge>{c.project_id}</Badge>
                </td>
                <td className="px-2 py-2 border-b border-slate-100">{(c.jc_ids || []).join(', ')}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {c.dispatch_date ? new Date(c.dispatch_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">{c.driver_name}</td>
                <td className="px-2 py-2 border-b border-slate-100">{c.vehicle_number}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <Badge status={c.status}>{c.status}</Badge>
                </td>
              </tr>
            ))}
            {!loading && challans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-slate-400">
                  No deliveries dispatched yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Delivery Challan"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={createChallan}>
              {saving ? 'Generating…' : 'Generate Challan'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="Project ID">
            <Input placeholder="PRJ042" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} />
          </Field>
          <Field label="JC references (comma separated)">
            <Input placeholder="JC01, JC02" value={form.jc_ids} onChange={(e) => setForm({ ...form, jc_ids: e.target.value })} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Driver name">
            <Input placeholder="Driver full name" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
          </Field>
          <Field label="Vehicle number">
            <Input placeholder="KA01-AB-1234" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Dispatch date">
            <Input type="date" value={form.dispatch_date} onChange={(e) => setForm({ ...form, dispatch_date: e.target.value })} />
          </Field>
          <Field label="Destination">
            <Input placeholder="Client site address" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </Field>
        </FormRow>
      </Modal>
    </AppShell>
  );
}
