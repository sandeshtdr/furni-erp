export default function Card({ title, subtitle, action, children, padded = true, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl mb-3.5 ${padded ? 'p-4' : ''} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between ${padded ? 'mb-3' : 'p-4 pb-0'}`}>
          <div>
            {title && <div className="text-[13px] font-medium">{title}</div>}
            {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
