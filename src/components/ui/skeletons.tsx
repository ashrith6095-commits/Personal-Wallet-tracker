"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
