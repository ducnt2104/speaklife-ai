"use client";

import React, {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

type InputProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    as?: "input";
  };

type TextareaProps = BaseInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: "textarea";
  };

type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (props, ref) => {
    const {
      label,
      error,
      helperText,
      icon,
      fullWidth = true,
      className = "",
      id,
      as,
      ...rest
    } = props;

    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const isPassword =
      !as && (rest as InputHTMLAttributes<HTMLInputElement>).type === "password";

    const baseClasses = [
      "w-full px-3 py-2 text-sm",
      "border rounded-lg",
      "bg-surface text-foreground",
      "placeholder:text-text-muted",
      "transition-colors duration-200",
      error
        ? "border-status-danger focus:ring-2 focus:ring-status-danger/20"
        : "border-border hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20",
      "focus:outline-none",
      icon ? "pl-10" : "",
      isPassword ? "pr-10" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          {as === "textarea" ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              className={`${baseClasses} min-h-[100px] resize-y`}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <>
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                id={inputId}
                className={baseClasses}
                type={
                  isPassword && showPassword
                    ? "text"
                    : (rest as InputHTMLAttributes<HTMLInputElement>).type
                }
                aria-invalid={!!error}
                aria-describedby={
                  error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                }
                {...(rest as InputHTMLAttributes<HTMLInputElement>)}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              )}
            </>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-status-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input, type InputProps, type TextareaProps };
