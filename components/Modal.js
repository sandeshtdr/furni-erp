'use client';

import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 p-5 w-full max-h-[80vh] overflow-y-auto scrollbar-thin relative"
        style={{ maxWidth: width }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3.5 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <div className="text-[15px] font-medium mb-3.5 pr-6">{title}</div>
        <div>{children}</div>
        {footer && <div className="flex gap-2 justify-end mt-4">{footer}</div>}
      </div>
    </div>
  );
}
