'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { Select } from '../../components/FormFields';

export default function BomPage() {
  const [jcs, setJcs] = useState([]);
  const [selectedJc, setSelectedJc] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const jcData = await fetch('/api/jc').then((r) => r.json());
      setJcs(Array.isArray(jcData) ? jcData : []);
      if (jcData?.length) setSelectedJc(jcData[0].id);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedJc) return;
    fetch(`/api/bom?jc_id=${selectedJc}`)
      .then((r) => r.json())
      .then((d) => setBomItems(Array.isArray(d) ? d : []));
  }, [selectedJc]);

  const currentJc = jcs.find((j) => j.id === selectedJc);
  const allCleared = bomItems.length > 0 && bomItems.every((b) => b.inward_status === 'Inwarded');

  return (
    <AppShell title="Bill of Materials">
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div className="text-[13px] font-medium">Bill of Materials</div>
        <Select value={selectedJc} onChange={(e) => setSelectedJc(e.target.value)} className="w-64">
          {jcs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.jc_number} — {j.product_name}
            </option>
          ))}
        </Select>
      </div>

      {currentJc && (
        <Card
          title={`${currentJc.project_id} — ${currentJc.product_name} (${currentJc.jc_number})`}
          action={<Badge status={allCleared ? 'Inwarded' : 'Pending'}>{allCleared ? 'Engineer Approved' : 'Awaiting Materials'}</Badge>}
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
              {!loading && bomItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-slate-400">
                    No BoM items recorded for this Job Card yet.
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
    </AppShell>
  );
}
