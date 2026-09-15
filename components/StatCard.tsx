export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-ink-200 rounded-lg border bg-white px-5 py-4">
      <p className="text-ink-500 text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-ink-500 mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
