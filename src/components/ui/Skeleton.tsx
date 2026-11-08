import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({
  className = "",
  width,
  height,
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${
        rounded ? "rounded-full" : "rounded-lg"
      } ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-6 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="40px" height="40px" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" className="w-1/2" />
          <Skeleton height="12px" className="w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
