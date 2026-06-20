'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, FormRow } from '../../components/FormFields';
import { Plus, AlertTriangle, Save } from 'lucide-react';

const PO_STATUS_OPTIONS = ['Not Ordered', 'Ordered', 'At Risk', 'Received'];

export default function ProcurementPage() {
  const [pos, setPos] = useState([]);
  const [jcs, setJcs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jc_id: '', material_name: '', vendor_id: '', quantity: '', unit: 'nos', expected_eta: '' });
  const [saving, setSaving] = useState(false);

  // Connected dropdowns + per-JC BoM line item tracking
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedJc, setSelectedJc] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [rowEdits, setRowEdits] = useState({}); // { [bomItemId]: { po_number, eta, po_status } }
  const [rowSaving, setRowSaving] = useState({}); // { [bomItemId]: true/false }

  async function load() {
    setLoading(true);
    const [poData, jcData, vendorData] = await Promise.all([
      fetch('/api/po').then((r) => r.json()),
      fetch('/api/jc').then((r) => r.json()),
      fetch('/api/vendors').then((r) => r.json()),
    ]);
    setPos(Array.isArray(poData) ? poData : []);
    const jcList = Array.isArray(jcData) ? jcData : [];
    setJcs(jcList);
    setVendors(Array.isArray(vendorData) ? vendorData : []);
    if (jcList.length && !selectedJc) {
      setSelectedJc(jcList[0].id);
      setSelectedProjectId(jcList[0].project_id);
    }
    setLoading(false);
  }

  async function loadBom(jcId) {
    if (!jcId) return;
    setBomLoading(true);
    const data = await fetch(`/api/bom?jc_id=${jcId}`).then((r) => r.json());
    const items = Array.isArray(data) ? data : [];
    setBomItems(items);
    setRowEdits(
      Object.fromEntries(
        items.map((b) => [
          b.id,
          { po_number: b.po_number || '', eta: b.eta || '', po_status: b.po_status || 'Not Ordered' },
        ])
      )
    );
    setBomLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadBom(selectedJc);
  }, [selectedJc]);

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

  // Unique list of Project IDs, derived from loaded Job Cards
  const projectIds = [...new Set(jcs.map((j) => j.project_id))].sort();
  const jcsInProject = jcs.filter((j) => j.project_id === selectedProjectId);
  const currentJc = jcs.find((j) => j.id === selectedJc);

  function handleProjectChange(pid) {
    setSelectedProjectId(pid);
    const firstJcInProject = jcs.find((j) => j.project_id === pid);
    setSelectedJc(firstJcInProject ? firstJcInProject.id : '');
  }

  function updateRowEdit(bomId, field, value) {
    setRowEdits((prev) => ({ ...prev, [bomId]: { ...prev[bomId], [field]: value } }));
  }

  async function saveRow(bomId) {
    const edit = rowEdits[bomId];
    if (!edit) return;
    setRowSaving((prev) => ({ ...prev, [bomId]: true }));
    await fetch(`/api/bom/${bomId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        po_number: edit.po_number,
        eta: edit.eta || null,
        po_status: edit.po_status,
      }),
    });
    setRowSaving((prev) => ({ ...prev, [bomId]: false }));
    loadBom(selectedJc);
  }

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

      {/* Per-JC BoM line item PO tracking */}
      <div className="flex items-center justify-between mb-3.5 mt-6 flex-wrap gap-2">
        <div>
          <div className="text-[13px] font-medium">Material PO tracking</div>
          <div className="text-[11px] text-slate-500">Select a Job Card to track PO number, ETA & status per material line</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select value={selectedProjectId} onChange={(e) => handleProjectChange(e.target.value)}>
              <option value="">Select Project…</option>
              {projectIds.map((pid) => (
                <option key={pid} value={pid}>
                  {pid}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-64">
            <Select value={selectedJc} onChange={(e) => setSelectedJc(e.target.value)} disabled={!selectedProjectId}>
              {!selectedProjectId && <option value="">Select a project first…</option>}
              {selectedProjectId && jcsInProject.length === 0 && <option value="">No Job Cards in this project</option>}
              {jcsInProject.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jc_number} — {j.product_name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {currentJc && (
        <Card
          title={`${currentJc.project_id} — ${currentJc.product_name} (${currentJc.jc_number})`}
          subtitle={`${bomItems.length} material${bomItems.length !== 1 ? 's' : ''}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                  <th className="px-2 py-2 border-b border-slate-100">Material</th>
                  <th className="px-2 py-2 border-b border-slate-100">Qty</th>
                  <th className="px-2 py-2 border-b border-slate-100">PO Number</th>
                  <th className="px-2 py-2 border-b border-slate-100">ETA</th>
                  <th className="px-2 py-2 border-b border-slate-100">PO Status</th>
                  <th className="px-2 py-2 border-b border-slate-100"></th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((b) => {
                  const edit = rowEdits[b.id] || { po_number: '', eta: '', po_status: 'Not Ordered' };
                  return (
                    <tr key={b.id}>
                      <td className="px-2 py-2 border-b border-slate-100">
                        <div className="font-medium">{b.material_name}</div>
                        <div className="text-[11px] text-slate-500">{b.specification}</div>
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100 whitespace-nowrap">
                        {b.quantity} {b.unit}
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100">
                        <input
                          type="text"
                          placeholder="PO-2024-…"
                          value={edit.po_number}
                          onChange={(e) => updateRowEdit(b.id, 'po_number', e.target.value)}
                          className="text-[12px] px-2 py-1 rounded-md border border-slate-300 w-32"
                        />
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100">
                        <input
                          type="date"
                          value={edit.eta}
                          onChange={(e) => updateRowEdit(b.id, 'eta', e.target.value)}
                          className="text-[12px] px-2 py-1 rounded-md border border-slate-300"
                        />
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100">
                        <select
                          value={edit.po_status}
                          onChange={(e) => updateRowEdit(b.id, 'po_status', e.target.value)}
                          className="text-[12px] px-2 py-1 rounded-md border border-slate-300"
                        >
                          {PO_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100">
                        <Button size="sm" variant="primary" disabled={rowSaving[b.id]} onClick={() => saveRow(b.id)}>
                          <Save size={12} /> {rowSaving[b.id] ? 'Saving…' : 'Save'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!bomLoading && bomItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-slate-400">
                      No BoM items for this Job Card yet.
                    </td>
                  </tr>
                )}
                {bomLoading && (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
