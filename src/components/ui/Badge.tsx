import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "success" | "warning" | "danger" | "info" | "neutral" | "default";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
  ...props
}) => {
  const variantClasses = {
    brand: "bg-primary-light text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-cyan-50 text-cyan-800 border-cyan-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    default: "bg-slate-100 text-slate-800 border-slate-200"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant] || variantClasses.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
