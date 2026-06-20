'use client';

import AppShell from '../../components/AppShell';
import { DOCS_DATA } from '../../lib/constants';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <AppShell title="Documents">
      <div className="text-[13px] font-medium mb-1">Document trail — 16 document types</div>
      <div className="text-[11px] text-slate-500 mb-3.5">Every document generated across the process, with its phase and owner</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {DOCS_DATA.map((d, i) => (
          <div key={d.n} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-600 flex-shrink-0">
                {i + 1}
              </div>
              <div className="text-[11px] font-medium leading-tight">{d.n}</div>
            </div>
            <div className="text-[10px] text-slate-500">Phase: {d.ph}</div>
            <div className="text-[10px] text-slate-700 font-medium">Owner: {d.ow}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
