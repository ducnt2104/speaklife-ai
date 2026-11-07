import React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorColor?: string;
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  indicatorColor = "bg-indigo-600",
  label,
  className = "",
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full space-y-1.5 ${className}`} {...props}>
      {label && (
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>{label}</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700"
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${indicatorColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
