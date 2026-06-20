'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, FormRow } from '../../components/FormFields';
import { Search, Upload, Plus, X, Check, AlertTriangle } from 'lucide-react';

export default function BomPage() {
  const [jcs, setJcs] = useState([]);
  const [selectedJc, setSelectedJc] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bomLoading, setBomLoading] = useState(false);

  // Searchable JC selector state
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Manual add-row modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ material_name: '', specification: '', quantity: '', unit: 'nos' });
  const [saving, setSaving] = useState(false);

  // CSV import state
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState([]); // parsed preview rows
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  async function loadJcs() {
    setLoading(true);
    const jcData = await fetch('/api/jc').then((r) => r.json());
    const list = Array.isArray(jcData) ? jcData : [];
    setJcs(list);
    if (list.length && !selectedJc) setSelectedJc(list[0].id);
    setLoading(false);
  }

  async function loadBom(jcId) {
    if (!jcId) return;
    setBomLoading(true);
    const data = await fetch(`/api/bom?jc_id=${jcId}`).then((r) => r.json());
    setBomItems(Array.isArray(data) ? data : []);
    setBomLoading(false);
  }

  useEffect(() => {
    loadJcs();
  }, []);

  useEffect(() => {
    loadBom(selectedJc);
  }, [selectedJc]);

  // Close the search dropdown when clicking outside it
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentJc = jcs.find((j) => j.id === selectedJc);
  const allCleared = bomItems.length > 0 && bomItems.every((b) => b.inward_status === 'Inwarded');

  const filteredJcs = jcs.filter((j) => {
    const q = search.toLowerCase();
    return (
      j.jc_number.toLowerCase().includes(q) ||
      j.product_name.toLowerCase().includes(q) ||
      (j.project_id || '').toLowerCase().includes(q)
    );
  });

  function selectJc(jc) {
    setSelectedJc(jc.id);
    setSearch('');
    setDropdownOpen(false);
  }

  async function addRow() {
    if (!addForm.material_name || !addForm.quantity || !selectedJc) return;
    setSaving(true);
    await fetch('/api/bom', {
      method: 'POST',
      body: JSON.stringify({
        jc_id: selectedJc,
        material_name: addForm.material_name,
        specification: addForm.specification,
        quantity: parseFloat(addForm.quantity),
        unit: addForm.unit,
      }),
    });
    setSaving(false);
    setAddOpen(false);
    setAddForm({ material_name: '', specification: '', quantity: '', unit: 'nos' });
    loadBom(selectedJc);
  }

  // --- CSV handling ---
  // Expected columns (header row required): material_name, specification, quantity, unit
  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return { rows: [], error: 'CSV needs a header row plus at least one data row.' };

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const required = ['material_name', 'quantity'];
    const missing = required.filter((r) => !header.includes(r));
    if (missing.length) {
      return { rows: [], error: `Missing required column(s): ${missing.join(', ')}. Expected header: material_name, specification, quantity, unit` };
    }

    const idx = {
      material_name: header.indexOf('material_name'),
      specification: header.indexOf('specification'),
      quantity: header.indexOf('quantity'),
      unit: header.indexOf('unit'),
    };

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        material_name: cols[idx.material_name] || '',
        specification: idx.specification > -1 ? cols[idx.specification] || '' : '',
        quantity: idx.quantity > -1 ? cols[idx.quantity] || '' : '',
        unit: idx.unit > -1 ? cols[idx.unit] || 'nos' : 'nos',
      };
    });

    const invalid = rows.filter((r) => !r.material_name || !r.quantity || isNaN(parseFloat(r.quantity)));
    if (invalid.length) {
      return { rows, error: `${invalid.length} row(s) are missing a material name or a valid numeric quantity. Fix the file and re-upload.` };
    }

    return { rows, error: '' };
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const { rows, error } = parseCsv(String(evt.target.result));
      setCsvRows(rows);
      setCsvError(error);
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!selectedJc || csvRows.length === 0 || csvError) return;
    setImporting(true);
    for (const row of csvRows) {
      await fetch('/api/bom', {
        method: 'POST',
        body: JSON.stringify({
          jc_id: selectedJc,
          material_name: row.material_name,
          specification: row.specification,
          quantity: parseFloat(row.quantity),
          unit: row.unit || 'nos',
        }),
      });
    }
    setImporting(false);
    setCsvOpen(false);
    setCsvRows([]);
    setCsvError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadBom(selectedJc);
  }

  function closeCsvModal() {
    setCsvOpen(false);
    setCsvRows([]);
    setCsvError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <AppShell title="Bill of Materials">
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div className="text-[13px] font-medium">Bill of Materials</div>

        {/* Searchable JC selector */}
        <div className="relative w-80" ref={searchRef}>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={currentJc ? `${currentJc.jc_number} — ${currentJc.product_name}` : 'Search Job Cards…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
              className="text-[12px] flex-1 outline-none bg-transparent"
            />
          </div>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto scrollbar-thin z-20">
              {filteredJcs.length === 0 && <div className="px-3 py-3 text-[12px] text-slate-400">No matching Job Cards.</div>}
              {filteredJcs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => selectJc(j)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 ${
                    j.id === selectedJc ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium truncate">{j.jc_number}</div>
                    <div className="text-[11px] text-slate-500 truncate">{j.product_name}</div>
                  </div>
                  <Badge>{j.project_id}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentJc && (
        <Card
          title={`${currentJc.project_id} — ${currentJc.product_name} (${currentJc.jc_number})`}
          subtitle={`${bomItems.length} material${bomItems.length !== 1 ? 's' : ''} listed`}
          action={
            <div className="flex items-center gap-2">
              <Badge status={allCleared ? 'Inwarded' : 'Pending'}>{allCleared ? 'Engineer Approved' : 'Awaiting Materials'}</Badge>
              <Button size="sm" onClick={() => setCsvOpen(true)}>
                <Upload size={13} /> Import CSV
              </Button>
              <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
                <Plus size={13} /> Add Material
              </Button>
            </div>
          }
        >
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-400 tracking-wide">
                <th className="px-2 py-2 border-b border-slate-100">#</th>
                <th className="px-2 py-2 border-b border-slate-100">Material</th>
                <th className="px-2 py-2 border-b border-slate-100">Specification</th>
                <th className="px-2 py-2 border-b border-slate-100">Qty</th>
                <th className="px-2 py-2 border-b border-slate-100">Unit</th>
                <th className="px-2 py-2 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {bomItems.map((b, i) => (
                <tr key={b.id}>
                  <td className="px-2 py-2 border-b border-slate-100">{i + 1}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{b.material_name}</td>
                  <td className="px-2 py-2 border-b border-slate-100 text-slate-500">{b.specification}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{b.quantity}</td>
                  <td className="px-2 py-2 border-b border-slate-100">{b.unit}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    <Badge status={b.inward_status}>{b.inward_status}</Badge>
                  </td>
                </tr>
              ))}
              {!bomLoading && bomItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-slate-400">
                    No BoM items recorded for this Job Card yet. Add one manually or import a CSV.
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

          {bomItems.some((b) => b.inward_status === 'Partial' || b.inward_status === 'Pending') && (
            <div className="mt-3 text-[11px] bg-amber-50 text-amber-700 rounded-lg p-2.5">
              Some materials are not fully inwarded. Floor release will remain blocked until 100% clearance.
            </div>
          )}
        </Card>
      )}

      {!loading && !currentJc && (
        <Card>
          <div className="text-[12px] text-slate-400 text-center py-6">No Job Cards available yet. Create one from the Job Cards page first.</div>
        </Card>
      )}

      {/* Add material modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add material"
        footer={
          <>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={addRow}>
              {saving ? 'Adding…' : 'Add material'}
            </Button>
          </>
        }
      >
        <FormRow>
          <Field label="Material name">
            <Input
              placeholder="e.g. Pre-lam board"
              value={addForm.material_name}
              onChange={(e) => setAddForm({ ...addForm, material_name: e.target.value })}
            />
          </Field>
          <Field label="Specification">
            <Input
              placeholder="e.g. 18mm White Matt"
              value={addForm.specification}
              onChange={(e) => setAddForm({ ...addForm, specification: e.target.value })}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Quantity">
            <Input
              type="number"
              placeholder="4"
              value={addForm.quantity}
              onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
            />
          </Field>
          <Field label="Unit">
            <Select value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}>
              <option value="nos">nos</option>
              <option value="Sheet">Sheet</option>
              <option value="metre">metre</option>
              <option value="kg">kg</option>
            </Select>
          </Field>
        </FormRow>
      </Modal>

      {/* CSV import modal */}
      <Modal open={csvOpen} onClose={closeCsvModal} title="Import materials from CSV" width={560}>
        <div className="text-[11px] bg-blue-50 text-blue-700 rounded-lg p-2.5 mb-3">
          CSV must have a header row with columns: <strong>material_name, specification, quantity, unit</strong>
          <br />
          (specification and unit are optional — unit defaults to "nos" if left blank)
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="text-[12px] mb-3 w-full"
        />

        {csvError && (
          <div className="flex items-start gap-2 text-[11px] bg-red-50 text-red-700 rounded-lg p-2.5 mb-3">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{csvError}</span>
          </div>
        )}

        {csvRows.length > 0 && !csvError && (
          <>
            <div className="flex items-center gap-2 text-[11px] bg-emerald-50 text-emerald-700 rounded-lg p-2.5 mb-3">
              <Check size={14} className="flex-shrink-0" />
              {csvRows.length} row{csvRows.length !== 1 ? 's' : ''} parsed successfully. Preview below — confirm to import into{' '}
              <strong>{currentJc?.jc_number}</strong>.
            </div>
            <div className="max-h-56 overflow-y-auto scrollbar-thin border border-slate-200 rounded-lg mb-3">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-[10px] uppercase text-slate-400">
                    <th className="px-2 py-1.5">Material</th>
                    <th className="px-2 py-1.5">Spec</th>
                    <th className="px-2 py-1.5">Qty</th>
                    <th className="px-2 py-1.5">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">{r.material_name}</td>
                      <td className="px-2 py-1.5 text-slate-500">{r.specification}</td>
                      <td className="px-2 py-1.5">{r.quantity}</td>
                      <td className="px-2 py-1.5">{r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex gap-2 justify-end">
          <Button onClick={closeCsvModal}>
            <X size={13} /> Cancel
          </Button>
          <Button variant="primary" disabled={csvRows.length === 0 || !!csvError || importing} onClick={confirmImport}>
            {importing ? 'Importing…' : `Import ${csvRows.length || ''} row${csvRows.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
