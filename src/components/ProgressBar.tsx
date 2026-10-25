export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-light" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${v === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-muted">{v}%</span>
    </div>
  );
}
