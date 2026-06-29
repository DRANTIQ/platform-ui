type CopyableValueProps = {
  label: string;
  value: string;
  hint?: string;
};

export function CopyableValue({ label, value, hint }: CopyableValueProps) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
          {value}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
