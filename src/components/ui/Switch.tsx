"use client";

import React, { forwardRef, type InputHTMLAttributes } from "react";

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  size?: "sm" | "md";
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = "md", className = "", id, ...rest }, ref) => {
    const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const trackSize = size === "sm" ? "w-8 h-[18px]" : "w-10 h-[22px]";
    const thumbSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
    const translate =
      size === "sm" ? "peer-checked:translate-x-3.5" : "peer-checked:translate-x-4.5";

    return (
      <label
        htmlFor={switchId}
        className={`inline-flex items-start gap-3 cursor-pointer select-none ${className}`}
      >
        <div className="relative shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            className="peer sr-only"
            role="switch"
            {...rest}
          />
          <div
            className={`${trackSize} rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-primary transition-colors duration-200`}
          />
          <div
            className={`absolute top-0.5 left-0.5 ${thumbSize} rounded-full bg-white shadow-sm transition-transform duration-200 ${translate}`}
          />
        </div>
        {(label || description) && (
          <div>
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
export { Switch, type SwitchProps };
