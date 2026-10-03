"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80",
        className
      )}
      {...props}
    />
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#111726] space-y-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
