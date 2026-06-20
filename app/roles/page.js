'use client';

import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import { RACI_DATA, RACI_ROLES } from '../../lib/constants';

const RACI_COLORS = {
  R: 'bg-blue-50 text-blue-700',
  A: 'bg-amber-50 text-amber-700',
  C: 'bg-purple-50 text-purple-700',
  I: 'bg-slate-100 text-slate-600',
};

export default function RolesPage() {
  return (
    <AppShell title="Roles & RACI">
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-2xl font-medium text-blue-600">7</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Roles in system</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-2xl font-medium text-amber-600">12</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Process stages</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-2xl font-medium">4</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Escalation levels</div>
        </div>
      </div>

      <Card title="Accountability matrix">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1.5 bg-slate-50 border border-slate-200">Process</th>
                {RACI_ROLES.map((r) => (
                  <th key={r} className="px-2 py-1.5 bg-slate-50 border border-slate-200 font-medium text-[10px]">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RACI_DATA.map((row) => (
                <tr key={row[0]}>
                  <td className="text-left px-2 py-1.5 border border-slate-200">{row[0]}</td>
                  {row.slice(1).map((cell, i) => (
                    <td key={i} className="px-2 py-1.5 border border-slate-200 text-center">
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-lg ${RACI_COLORS[cell]}`}>
                        {cell}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-600">
          <span><span className={`inline-block px-1.5 py-0.5 rounded-lg ${RACI_COLORS.R} font-medium mr-1`}>R</span>Responsible — does the work</span>
          <span><span className={`inline-block px-1.5 py-0.5 rounded-lg ${RACI_COLORS.A} font-medium mr-1`}>A</span>Accountable — final decision</span>
          <span><span className={`inline-block px-1.5 py-0.5 rounded-lg ${RACI_COLORS.C} font-medium mr-1`}>C</span>Consulted — input required</span>
          <span><span className={`inline-block px-1.5 py-0.5 rounded-lg ${RACI_COLORS.I} font-medium mr-1`}>I</span>Informed — kept in loop</span>
        </div>
      </Card>
    </AppShell>
  );
}
