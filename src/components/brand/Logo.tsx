"use client";

import React from "react";

export interface LogoProps {
  variant?: "full" | "icon" | "compact" | "monochrome";
  size?: "sm" | "md" | "lg" | "xl" | number;
  animated?: boolean;
  className?: string;
  showBadge?: boolean;
}

/**
 * SpeakLife AI — Signature Brandmark Logo
 * Design Concept: Voice Waveform (Sound of Eloquence) fused with
 * Angelic Wings of Confidence & Wisdom Halo, crowned with stylized AI spark.
 * Signature Gradient: Electric Cyan (#06B6D4) -> Neon Cobalt (#3B82F6) -> Ethereal Violet (#8B5CF6)
 */
export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  animated = false,
  className = "",
  showBadge = true,
}) => {
  // Determine pixel size
  let pxSize = 40;
  if (typeof size === "number") {
    pxSize = size;
  } else {
    switch (size) {
      case "sm":
        pxSize = 28;
        break;
      case "md":
        pxSize = 40;
        break;
      case "lg":
        pxSize = 56;
        break;
      case "xl":
        pxSize = 72;
        break;
    }
  }

  const isMonochrome = variant === "monochrome";

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* ── Brandmark Icon (SVG Vector) ── */}
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          animated ? "group" : ""
        }`}
        style={{ width: pxSize, height: pxSize }}
      >
        {/* Glow backlight behind icon */}
        {!isMonochrome && (
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/30 via-blue-500/30 to-violet-500/40 blur-md ${
              animated ? "animate-pulse" : ""
            }`}
          />
        )}

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Signature Brand Gradient */}
            <linearGradient id="speaklife-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* Accent Wing Gradient */}
            <linearGradient id="speaklife-gradient-wing" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.85" />
            </linearGradient>

            {/* Subtle Inner Glow */}
            <radialGradient id="speaklife-spark-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>

            <filter id="logo-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06B6D4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Squircle Shield */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            fill={isMonochrome ? "currentColor" : "url(#speaklife-gradient-primary)"}
            className="transition-transform duration-300"
          />

          {/* Inner Deep Glass Layer */}
          <rect
            x="7"
            y="7"
            width="86"
            height="86"
            rx="23"
            fill={isMonochrome ? "rgba(0,0,0,0.8)" : "#090D16"}
            fillOpacity="0.92"
          />

          {/* ── Left Wing / Radiating Wave (Confidence) ── */}
          <path
            d="M 24 50 C 24 36, 32 25, 42 22 C 37 30, 36 42, 38 52 C 35 52, 30 52, 24 50 Z"
            fill="url(#speaklife-gradient-wing)"
            opacity="0.85"
          />
          <path
            d="M 18 50 C 18 41, 23 33, 30 30 C 26 36, 26 44, 27 51 Z"
            fill="#06B6D4"
            opacity="0.6"
          />

          {/* ── Right Wing / Radiating Wave (Wisdom) ── */}
          <path
            d="M 76 50 C 76 36, 68 25, 58 22 C 63 30, 64 42, 62 52 C 65 52, 70 52, 76 50 Z"
            fill="url(#speaklife-gradient-wing)"
            opacity="0.85"
          />
          <path
            d="M 82 50 C 82 41, 77 33, 70 30 C 74 36, 74 44, 73 51 Z"
            fill="#8B5CF6"
            opacity="0.6"
          />

          {/* ── Center Dynamic Voice Waveform (5 Vertical Bars of Eloquence) ── */}
          {/* Bar 1 (Left Outer) */}
          <rect x="33" y="44" width="4.5" height="14" rx="2.25" fill="#06B6D4" />
          {/* Bar 2 (Left Mid) */}
          <rect x="41" y="34" width="4.5" height="34" rx="2.25" fill="#38BDF8" />
          {/* Bar 3 (Center Pinnacle) */}
          <rect x="48" y="24" width="4.5" height="52" rx="2.25" fill="#FFFFFF" />
          {/* Bar 4 (Right Mid) */}
          <rect x="55" y="34" width="4.5" height="34" rx="2.25" fill="#818CF8" />
          {/* Bar 5 (Right Outer) */}
          <rect x="63" y="44" width="4.5" height="14" rx="2.25" fill="#C084FC" />

          {/* ── The AI Wisdom Spark (Top Starburst) ── */}
          <circle cx="50.25" cy="18" r="4" fill="#FFFFFF" filter="url(#logo-drop-shadow)" />
          <path
            d="M 50.25 10 L 51.5 16.5 L 58 18 L 51.5 19.5 L 50.25 26 L 49 19.5 L 42.5 18 L 49 16.5 Z"
            fill="#38BDF8"
          />

          {/* ── Base Foundation Arch ── */}
          <path
            d="M 32 80 C 42 84, 58 84, 68 80"
            stroke="url(#speaklife-gradient-primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── Typographic Signature ── */}
      {(variant === "full" || variant === "compact") && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
              SpeakLife
            </span>
            <span className="font-heading font-extrabold text-lg sm:text-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              AI
            </span>
            {showBadge && variant === "full" && (
              <span className="ml-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/10 to-violet-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hidden sm:inline-block">
                Đồng Nai 2026
              </span>
            )}
          </div>
          {variant === "full" && (
            <p className="text-[11px] text-text-muted mt-1 leading-tight tracking-normal hidden sm:block">
              Phòng luyện phản xạ & thuyết trình AI
            </p>
          )}
        </div>
      )}
    </div>
  );
};
