export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-ink-200 rounded-lg border border-dashed bg-white px-6 py-12 text-center">
      <p className="text-ink-700 text-sm font-medium">{title}</p>
      {hint ? <p className="text-ink-500 mx-auto mt-1 max-w-md text-sm">{hint}</p> : null}
    </div>
  );
}
