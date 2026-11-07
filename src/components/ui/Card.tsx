import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variantClasses = {
    default: "bg-surface border border-border shadow-sm",
    elevated: "bg-surface border border-border shadow-md",
    interactive: "bg-surface border border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
  };

  return (
    <div className={`rounded-xl p-5 ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = "", ...props }) => (
  <h3 className={`font-heading font-semibold text-foreground text-base tracking-tight leading-none ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = "", ...props }) => (
  <p className={`text-xs text-text-muted leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`pt-2 ${className}`} {...props}>
    {children}
  </div>
);
