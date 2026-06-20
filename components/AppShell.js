'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Contact, ListChecks, ShoppingCart,
  Warehouse, Wrench, ClipboardCheck, Truck, Users, FileStack,
  PanelLeftClose, PanelLeftOpen, Bell, Armchair, Circle,
} from 'lucide-react';

// Safety net: if an icon import is ever undefined (version mismatch, typo, etc.)
// fall back to a plain circle instead of crashing the whole app.
function SafeIcon({ icon: Icon, ...props }) {
  const Component = Icon || Circle;
  return <Component {...props} />;
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Planning',
    items: [
      { href: '/mo', label: 'Mfg Orders', icon: FileText },
      { href: '/jc', label: 'Job Cards', icon: Contact },
      { href: '/bom', label: 'Bill of Materials', icon: ListChecks },
    ],
  },
  {
    label: 'Supply',
    items: [
      { href: '/procurement', label: 'Procurement', icon: ShoppingCart },
      { href: '/stores', label: 'Stores', icon: Warehouse },
    ],
  },
  {
    label: 'Production',
    items: [
      { href: '/floor', label: 'Floor Tracker', icon: Wrench },
      { href: '/qc', label: 'Quality Control', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Dispatch',
    items: [{ href: '/dispatch', label: 'Dispatch', icon: Truck }],
  },
  {
    label: 'Admin',
    items: [
      { href: '/roles', label: 'Roles & RACI', icon: Users },
      { href: '/documents', label: 'Documents', icon: FileStack },
    ],
  },
];

const ROLE_OPTIONS = [
  { value: 'mgr', label: 'Production Manager' },
  { value: 'planner', label: 'Planner' },
  { value: 'proc', label: 'Procurement' },
  { value: 'stores', label: 'Stores' },
  { value: 'floor', label: 'Station Owner' },
  { value: 'qc', label: 'QC Head' },
  { value: 'dispatch', label: 'Dispatch' },
];

export default function AppShell({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-slate-100">
      {/* SIDEBAR */}
      <nav
        className={`flex flex-col flex-shrink-0 bg-white border-r border-slate-200 transition-all ${
          collapsed ? 'w-[52px]' : 'w-[210px]'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-slate-200">
          <div className="w-7 h-7 rounded-md bg-navy flex items-center justify-center flex-shrink-0">
            <Armchair size={16} className="text-tealLt" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[13px] font-medium leading-tight">FurniERP</div>
              <div className="text-[10px] text-slate-400 leading-tight">Production OS</div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 mx-1.5 my-0.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <SafeIcon icon={item.icon} size={16} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-slate-600 hover:bg-slate-100"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="h-[52px] flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-5 gap-3">
          <span className="text-[15px] font-medium flex-1">{title}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Role:</span>
            <select
              defaultValue="mgr"
              className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-slate-50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative p-1 cursor-pointer">
            <Bell size={18} className="text-slate-600" />
            <div className="absolute top-0 right-0 w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">{children}</div>
      </div>
    </div>
  );
}
