"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="erp-kpi-card">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-1 h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function PageSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="erp-kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      {/* Table */}
      <div className="erp-table-card">
        <table className="erp-table">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Skeleton;
