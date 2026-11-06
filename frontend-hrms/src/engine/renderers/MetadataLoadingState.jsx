import React from 'react'

export default function MetadataLoadingState({
  title = 'Loading records...',
  subtitle = 'Please wait while we prepare the data',
  rows = 5,
  type = 'table', // 'table' | 'profile' | 'form'
}) {
  if (type === 'profile') {
    return (
      <div className="w-full space-y-4 animate-pulse">
        {/* Hero Card Skeleton */}
        <div className="h-44 w-full rounded-2xl bg-slate-200/80" />
        {/* Tab Bar Skeleton */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-28 rounded-xl bg-slate-200" />
          ))}
        </div>
        {/* Sections Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/6 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-64 rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/6 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 w-full rounded-xl bg-slate-200" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-slate-200" />
                <div className="h-9 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: Table skeleton
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="h-4 w-44 rounded bg-slate-200" />
          <div className="h-3 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-8 w-32 rounded-xl bg-slate-200" />
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-none">
            <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
