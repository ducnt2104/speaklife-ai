"use client";

import React from "react";
import { Logo } from "./Logo";

export interface BrandLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * SpeakLife AI — Brandmark Glowing Spinner Loader
 * Replaces generic loading spinners with a sci-fi ambient glowing brand ring.
 */
export const BrandLoader: React.FC<BrandLoaderProps> = ({
  label = "Đang xử lý dữ liệu...",
  size = "md",
  className = "",
}) => {
  const ringSize = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const iconSize = size === "sm" ? 24 : size === "lg" ? 40 : 32;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 text-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Glow Aura */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-500/30 to-violet-500/40 blur-xl animate-pulse" />

        {/* Rotating Sci-Fi Ring */}
        <div
          className={`${ringSize} rounded-2xl border-2 border-cyan-500/20 border-t-cyan-400 border-r-violet-400 animate-spin flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.35)]`}
        />

        {/* Static Centered Brandmark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Logo variant="icon" size={iconSize} />
        </div>
      </div>

      {/* Status Label */}
      <div className="space-y-1">
        <p className="font-heading font-semibold text-sm text-foreground tracking-tight">{label}</p>
        <p className="text-[11px] text-text-muted font-mono">SpeakLife AI • Zero-Data Edge Vision</p>
      </div>
    </div>
  );
};
