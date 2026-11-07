import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorColor?: string;
  label?: string;
  showValue?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      indicatorColor = "bg-primary",
      label,
      showValue = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const roundedValue = Math.round(percentage);

    return (
      <div ref={ref} className={cn("w-full space-y-1.5", className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between text-xs text-text-secondary font-medium">
            {label && <span>{label}</span>}
            {showValue && <span className="font-mono">{roundedValue}%</span>}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={roundedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || "Tiến độ"}
          className="h-2.5 w-full bg-surface-subtle dark:bg-slate-800 rounded-full overflow-hidden border border-border"
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out motion-reduce:transition-none",
              indicatorColor
            )}
            style={{ width: `${roundedValue}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";
