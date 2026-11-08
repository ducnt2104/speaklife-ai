import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        // SpeakLife AI Signature Brand Colors
        brand: {
          dark: "#080C14",
          darker: "#05070B",
          card: "rgba(15, 23, 42, 0.75)",
          cyan: "#06B6D4",
          cobalt: "#3B82F6",
          purple: "#8B5CF6",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle: "var(--color-surface-subtle)"
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)"
        },
        secondary: "var(--color-secondary)",
        accent: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-accent-light)"
        },
        border: "var(--color-border)",
        status: {
          success: "var(--color-status-success)",
          warning: "var(--color-status-warning)",
          danger: "var(--color-status-danger)",
          info: "var(--color-status-info)"
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "neon-cyan": "0 0 25px -4px rgba(6, 182, 212, 0.5)",
        "neon-purple": "0 0 25px -4px rgba(139, 92, 246, 0.5)",
        "neon-emerald": "0 0 25px -4px rgba(16, 185, 129, 0.5)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.36)",
      },
      animation: {
        "shimmer": "shimmer 2.5s infinite linear",
        "glow-pulse": "glow-pulse 3s infinite ease-in-out",
        "float": "float 4s infinite ease-in-out",
        "equalizer": "equalizer 1.2s infinite ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        equalizer: {
          "0%, 100%": { height: "20%" },
          "50%": { height: "95%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
