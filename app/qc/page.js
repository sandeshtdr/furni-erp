'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, Textarea, FormRow } from '../../components/FormFields';
import { Plus, AlertTriangle } from 'lucide-react';

export default function QcPage() {
  const [ncrs, setNcrs] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jc_id: '', defect_description: '', severity: 'Minor', root_cause: '', corrective_action: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [ncrData, jcData] = await Promise.all([
      fetch('/api/ncr').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
    ]);
    setNcrs(Array.isArray(ncrData) ? ncrData : []);
    setJcs(Array.isArray(jcData) ? jcData : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createNCR() {
    if (!form.jc_id || !form.defect_description) return;
    setSaving(true);
    await fetch('/api/ncr', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    setOpen(false);
    setForm({ jc_id: '', defect_description: '', severity: 'Minor', root_cause: '', corrective_action: '' });
    load();
  }

  const openNcrs = ncrs.filter((n) => n.status === 'Open');
  const qcQueue = jcs.filter((j) => j.stage === 'QC');

  return (
    <AppShell title="Quality Control">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-medium">Quality Control</div>
          <div className="text-[11px] text-slate-500">Independent team · 100% inspection</div>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={14} /> Raise NCR
        </Button>
      </div>

      {openNcrs.map((n) => (
        <div key={n.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] mb-2.5">
          <AlertTriangle size={16} />
          <strong>{n.ncr_number}</strong> on {n.job_cards?.jc_number} — {n.defect_description}. Awaiting QC Head + PM joint decision.
        </div>
      ))}

      <div className="grid lg:grid-cols-2 gap-3.5">
        <Card title="NCR register">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-2 py-2 border-b border-slate-100">NCR No.</th>
                <th className="px-2 py-2 border-b border-slate-100">JC</th>
                <th className="px-2 py-2 border-b border-slate-100">Defect</th>
                <th className="px-2 py-2 border-b border-slate-100">Severity</th>
                <th className="px-2 py-2 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((n) => (
                <tr key={n.id}>
                  <td className="px-2 py-2 border-b border-slate-100 font-medium">{n.ncr_number}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{n.job_cards?.jc_number}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{n.defect_description}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    <Badge status={n.severity === 'Major' ? 'Open' : 'Pending'}>{n.severity}</Badge>
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    <Badge status={n.status}>{n.status}</Badge>
                  </td>
                </tr>
              ))}
              {!loading && ncrs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-slate-400">
                    No NCRs raised yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card title="QC sign-off queue">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-2 py-2 border-b border-slate-100">JC</th>
                <th className="px-2 py-2 border-b border-slate-100">Product</th>
                <th className="px-2 py-2 border-b border-slate-100">Status</th>
                <th className="px-2 py-2 border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {qcQueue.map((j) => (
                <tr key={j.id}>
                  <td className="px-2 py-2 border-b border-slate-100 font-medium">{j.jc_number}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{j.product_name}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    <Badge status={j.status}>{j.status}</Badge>
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {j.status === 'QC Hold' ? (
                      <Button size="sm" variant="danger">
                        Review NCR
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary">
                        Sign off
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && qcQueue.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-slate-400">
                    No Job Cards awaiting QC sign-off.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise NCR — Non-Conformance Report"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={saving} onClick={createNCR}>
              {saving ? 'Submitting…' : 'Submit NCR'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="JC number">
            <Select value={form.jc_id} onChange={(e) => setForm({ ...form, jc_id: e.target.value })}>
              <option value="">Select JC…</option>
              {jcs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jc_number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Severity">
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="Minor">Minor — rework at station</option>
              <option value="Major">Major — PM + QC decision</option>
            </Select>
          </Field>
        </FormRow>
        <Field label="Defect description">
          <Textarea
            rows={2}
            placeholder="Describe the non-conformance in detail…"
            value={form.defect_description}
            onChange={(e) => setForm({ ...form, defect_description: e.target.value })}
          />
        </Field>
        <FormRow>
          <Field label="Root cause">
            <Input placeholder="e.g. CNC program error" value={form.root_cause} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} />
          </Field>
          <Field label="Corrective action">
            <Input
              placeholder="e.g. Rework at assembly"
              value={form.corrective_action}
              onChange={(e) => setForm({ ...form, corrective_action: e.target.value })}
            />
          </Field>
        </FormRow>
      </Modal>
    </AppShell>
  );
}
