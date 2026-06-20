'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, Textarea, FormRow } from '../../components/FormFields';
import { Plus } from 'lucide-react';

export default function MOPage() {
  const [mos, setMos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name: '', project_type: 'Commercial', delivery_date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await fetch('/api/mo').then((r) => r.json());
    setMos(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createMO() {
    if (!form.client_name) return;
    setSaving(true);
    await fetch('/api/mo', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    setOpen(false);
    setForm({ client_name: '', project_type: 'Commercial', delivery_date: '', notes: '' });
    load();
  }

  return (
    <AppShell title="Manufacturing Orders">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-medium">Manufacturing Orders</div>
          <div className="text-[11px] text-slate-500">One MO = one project</div>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={14} /> New MO
        </Button>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-4 py-2.5 border-b border-slate-100">MO No.</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Project ID</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Client</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Job Cards</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Status</th>
                <th className="px-4 py-2.5 border-b border-slate-100">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {mos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 border-b border-slate-100 font-medium">{m.mo_number}</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <Badge>{m.project_id}</Badge>
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">{m.client_name}</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">{m.job_cards?.[0]?.count ?? 0} JCs</td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <Badge status={m.status}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    {m.delivery_date ? new Date(m.delivery_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!loading && mos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No manufacturing orders yet. Create your first one.
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
        title="New Manufacturing Order"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={createMO}>
              {saving ? 'Creating…' : 'Create MO + Project ID'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="Client name">
            <Input
              placeholder="e.g. Prestige Interiors"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </Field>
          <Field label="Delivery date">
            <Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
          </Field>
        </FormRow>
        <FormRow>
        <Field label="Project type">
  <Select value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
    <option>Commercial</option>
    <option>Residential</option>
  </Select>
</Field>
          <div />
        </FormRow>
        <Field label="Notes">
          <Textarea rows={2} placeholder="Special requirements…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </Modal>
    </AppShell>
  );
}
