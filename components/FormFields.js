export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1 mb-2.5">
      <label className="text-[11px] text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const fieldClass =
  'text-[12px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full';

export function Input(props) {
  return <input className={fieldClass} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={fieldClass} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={fieldClass} {...props} />;
}

export function FormRow({ children }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}
