'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, FormRow } from '../../components/FormFields';
import { Plus, AlertTriangle } from 'lucide-react';

export default function ProcurementPage() {
  const [pos, setPos] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jc_id: '', material_name: '', vendor_id: '', quantity: '', unit: 'nos', expected_eta: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [poData, jcData, vendorData] = await Promise.all([
      fetch('/api/po').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
      fetch('/api/vendors').then((r) => r.json()),
    ]);
    setPos(Array.isArray(poData) ? poData : []);
    setJcs(Array.isArray(jcData) ? jcData : []);
    setVendors(Array.isArray(vendorData) ? vendorData : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPO() {
    if (!form.material_name || !form.jc_id) return;
    const jc = jcs.find((j) => j.id === form.jc_id);
    setSaving(true);
    await fetch('/api/po', {
      method: 'POST',
      body: JSON.stringify({ ...form, project_id: jc?.project_id }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ jc_id: '', material_name: '', vendor_id: '', quantity: '', unit: 'nos', expected_eta: '' });
    load();
  }

  const atRisk = pos.filter((p) => p.status === 'At Risk');

  return (
    <AppShell title="Procurement">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-medium">Procurement</div>
          <div className="text-[11px] text-slate-500">All POs tagged with Project ID</div>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={14} /> Raise PO
        </Button>
      </div>

      {atRisk.map((p) => (
        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] mb-2.5">
          <AlertTriangle size={16} />
          <strong>{p.po_number}</strong> — {p.material_name} ETA is at risk. Expedite action required.
        </div>
      ))}

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-4 py-2.5 border-b border-slate-100">PO No.</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Project</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Material</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Vendor</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Qty</th>
                <th className="px-4 py-2.5 border-b border-slate-100">ETA</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 border-b border-slate-100 font-medium">{p.po_number}</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <Badge>{p.project_id}</Badge>
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">{p.material_name}</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">{p.vendors?.name || '—'}</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    {p.expected_eta ? new Date(p.expected_eta).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <Badge status={p.status}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
              {!loading && pos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No purchase orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise Purchase Order"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={createPO}>
              {saving ? 'Raising…' : 'Raise PO'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="Job Card">
            <Select value={form.jc_id} onChange={(e) => setForm({ ...form, jc_id: e.target.value })}>
              <option value="">Select JC…</option>
              {jcs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jc_number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vendor">
            <Select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Material">
            <Input
              placeholder="Edge banding tape PVC 22mm"
              value={form.material_name}
              onChange={(e) => setForm({ ...form, material_name: e.target.value })}
            />
          </Field>
          <Field label="Quantity">
            <Input type="number" placeholder="150" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="nos">nos</option>
              <option value="Sheet">Sheet</option>
              <option value="metre">metre</option>
              <option value="kg">kg</option>
            </Select>
          </Field>
          <Field label="Expected delivery">
            <Input type="date" value={form.expected_eta} onChange={(e) => setForm({ ...form, expected_eta: e.target.value })} />
          </Field>
        </FormRow>
      </Modal>
    </AppShell>
  );
}
