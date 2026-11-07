import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "info" | "success" | "warning" | "destructive" | "error";
  icon?: boolean;
}

const alertVariants: Record<string, { container: string; icon: React.FC<any> }> = {
  default: {
    container: "bg-cyan-50/70 text-cyan-950 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-200 dark:border-cyan-800",
    icon: Info,
  },
  info: {
    container: "bg-cyan-50/70 text-cyan-950 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-200 dark:border-cyan-800",
    icon: Info,
  },
  success: {
    container: "bg-emerald-50/70 text-emerald-950 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    container: "bg-amber-50/70 text-amber-950 border-amber-200 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
  },
  destructive: {
    container: "bg-rose-50/70 text-rose-950 border-rose-200 dark:bg-rose-950/20 dark:text-rose-200 dark:border-rose-800",
    icon: AlertCircle,
  },
  error: {
    container: "bg-rose-50/70 text-rose-950 border-rose-200 dark:bg-rose-950/20 dark:text-rose-200 dark:border-rose-800",
    icon: AlertCircle,
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", icon = true, children, ...props }, ref) => {
    const config = alertVariants[variant] || alertVariants.default;
    const IconComponent = config.icon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-xl border p-4 flex items-start gap-3 text-sm leading-relaxed",
          config.container,
          className
        )}
        {...props}
      >
        {icon && <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />}
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-heading font-semibold text-sm leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h5>
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed opacity-90 mt-1", className)}
    {...props}
  >
    {children}
  </div>
));
AlertDescription.displayName = "AlertDescription";
