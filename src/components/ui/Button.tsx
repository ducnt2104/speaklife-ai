import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "danger"
    | "link"
    | "cyan";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const variantStyles: Record<string, string> = {
  default:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm hover:shadow",
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm hover:shadow",
  secondary:
    "bg-secondary text-white hover:opacity-90 focus-visible:ring-secondary shadow-sm",
  outline:
    "border border-border bg-surface text-foreground hover:bg-surface-subtle focus-visible:ring-primary shadow-sm",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-subtle focus-visible:ring-primary",
  destructive:
    "bg-status-danger text-white hover:opacity-90 focus-visible:ring-status-danger shadow-sm",
  danger:
    "bg-status-danger text-white hover:opacity-90 focus-visible:ring-status-danger shadow-sm",
  link:
    "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
  cyan:
    "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500 shadow-sm",
};

const sizeStyles: Record<string, string> = {
  sm: "text-xs h-8 px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm h-10 px-4 py-2.5 gap-2 rounded-lg",
  lg: "text-base h-12 px-6 py-3.5 gap-2.5 rounded-xl font-semibold",
  icon: "h-9 w-9 p-0 rounded-lg flex items-center justify-center shrink-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isButtonDisabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium select-none cursor-pointer",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Emil Kowalski Motion Physics: snappy press feedback
          "transition-transform duration-160 ease-out active:scale-[0.97] motion-reduce:transform-none",
          // Disabled state
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          // Variant & Size classes
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.md,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Đang xử lý...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
