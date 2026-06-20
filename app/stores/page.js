'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, Textarea, FormRow } from '../../components/FormFields';
import { Plus } from 'lucide-react';

export default function StoresPage() {
  const [grns, setGrns] = useState([]);
  const [pos, setPos] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [bomByJc, setBomByJc] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ po_id: '', received_qty: '', qc_result: 'Pass', moisture_content: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [grnData, poData, jcData] = await Promise.all([
      fetch('/api/grn').then((r) => r.json()),
      fetch('/api/po').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
    ]);
    setGrns(Array.isArray(grnData) ? grnData : []);
    setPos(Array.isArray(poData) ? poData : []);
    setJcs(Array.isArray(jcData) ? jcData : []);

    // fetch bom clearance % for each jc
    const jcList = Array.isArray(jcData) ? jcData.slice(0, 6) : [];
    const entries = await Promise.all(
      jcList.map(async (j) => {
        const bom = await fetch(`/api/bom?jc_id=${j.id}`).then((r) => r.json());
        return [j.id, Array.isArray(bom) ? bom : []];
      })
    );
    setBomByJc(Object.fromEntries(entries));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGRN() {
    if (!form.po_id) return;
    setSaving(true);
    await fetch('/api/grn', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    setOpen(false);
    setForm({ po_id: '', received_qty: '', qc_result: 'Pass', moisture_content: '', remarks: '' });
    load();
  }

  return (
    <AppShell title="Stores">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-medium">Stores — Inward &amp; Clearance Gate</div>
          <div className="text-[11px] text-slate-500">100% material clearance required before floor release</div>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={14} /> Create GRN
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-3.5">
        <Card title="Material clearance status">
          <div className="flex flex-col gap-3">
            {Object.entries(bomByJc).map(([jcId, items]) => {
              const jc = jcs.find((j) => j.id === jcId);
              if (!items.length) return null;
              const cleared = items.filter((b) => b.inward_status === 'Inwarded').length;
              const pct = Math.round((cleared / items.length) * 100);
              const isFull = pct === 100;
              return (
                <div key={jcId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium">{jc?.jc_number}</span>
                    <Badge status={isFull ? 'Inwarded' : pct >= 70 ? 'Partial' : 'Pending'}>
                      {isFull ? 'Cleared' : pct >= 70 ? 'Partial' : 'On Hold'}
                    </Badge>
                  </div>
                  <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{pct}% materials inwarded</div>
                </div>
              );
            })}
            {!loading && Object.keys(bomByJc).length === 0 && (
              <div className="text-[12px] text-slate-400">No BoM-linked Job Cards yet.</div>
            )}
          </div>
        </Card>

        <Card title="Recent GRNs">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-2 py-2 border-b border-slate-100">GRN No.</th>
                <th className="px-2 py-2 border-b border-slate-100">PO</th>
                <th className="px-2 py-2 border-b border-slate-100">Material</th>
                <th className="px-2 py-2 border-b border-slate-100">QC</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => (
                <tr key={g.id}>
                  <td className="px-2 py-2 border-b border-slate-100">{g.grn_number}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{g.purchase_orders?.po_number}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{g.purchase_orders?.material_name}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    <Badge status={g.qc_result === 'Pass' ? 'Received' : 'Partial'}>{g.qc_result}</Badge>
                  </td>
                </tr>
              ))}
              {!loading && grns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-slate-400">
                    No GRNs yet.
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
        title="Create Goods Receipt Note"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={createGRN}>
              {saving ? 'Submitting…' : 'Submit GRN'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="PO Number">
            <Select value={form.po_id} onChange={(e) => setForm({ ...form, po_id: e.target.value })}>
              <option value="">Select PO…</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.po_number} — {p.material_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Received qty">
            <Input type="number" placeholder="150" value={form.received_qty} onChange={(e) => setForm({ ...form, received_qty: e.target.value })} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="QC result">
            <Select value={form.qc_result} onChange={(e) => setForm({ ...form, qc_result: e.target.value })}>
              <option>Pass</option>
              <option>Partial — shortage</option>
              <option>Reject</option>
            </Select>
          </Field>
          <Field label="MC% (if board)">
            <Input type="number" placeholder="12" value={form.moisture_content} onChange={(e) => setForm({ ...form, moisture_content: e.target.value })} />
          </Field>
        </FormRow>
        <Field label="Remarks">
          <Textarea rows={2} placeholder="Any defects, shortages or notes…" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
        </Field>
      </Modal>
    </AppShell>
  );
}
