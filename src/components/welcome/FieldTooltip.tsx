import { useId, useState } from "react";

type FieldTooltipProps = {
  label: string;
  hint: string;
};

export function FieldTooltip({ label, hint }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span>{label}</span>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label={`Help: ${hint}`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case text-slate-600 shadow-lg"
        >
          {hint}
        </span>
      )}
    </span>
  );
}
