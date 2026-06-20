import { STATUS_STYLES } from '../lib/constants';

export default function Badge({ children, status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES[children] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${style}`}
    >
      {children}
    </span>
  );
}
