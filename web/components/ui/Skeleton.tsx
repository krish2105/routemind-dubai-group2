/**
 * Loading placeholders with a soft shimmer (the shimmer stops with reduced motion).
 *
 *   {loading ? <SkeletonCard /> : <KpiCard ... />}
 *   <Skeleton className="h-64 w-full" />          // chart or map area
 *   <SkeletonText lines={3} />
 */
export function Skeleton({ className = "", rounded = "rounded-lg" }: { className?: string; rounded?: string }) {
  return <span aria-hidden className={`skeleton block ${rounded} ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden className={`block space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} rounded="rounded" />
      ))}
    </span>
  );
}

/** Same footprint as a KpiCard. Announces "Loading" once to screen readers. */
export function SkeletonCard({ className = "", label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div role="status" className={`glass rounded-2xl p-4 ${className}`}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-3 w-24" rounded="rounded" />
      <div className="mt-4 flex items-end justify-between gap-3">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
      <Skeleton className="mt-3 h-3 w-32" rounded="rounded" />
    </div>
  );
}
