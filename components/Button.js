export default function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    dark: 'border-navy bg-navy text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-[12px]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
