import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--ag-canvas-rgb) / <alpha-value>)",
        surface: "rgb(var(--ag-surface-rgb) / <alpha-value>)",
        "surface-2": "rgb(var(--ag-surface-2-rgb) / <alpha-value>)",
        "surface-3": "rgb(var(--ag-surface-3-rgb) / <alpha-value>)",
        ink: "rgb(var(--ag-ink-rgb) / <alpha-value>)",
        "ink-muted": "rgb(var(--ag-ink-muted-rgb) / <alpha-value>)",
        "ink-dim": "rgb(var(--ag-ink-dim-rgb) / <alpha-value>)",
        accent: "rgb(var(--ag-accent-rgb) / <alpha-value>)",
        telemetry: "rgb(var(--ag-telemetry-rgb) / <alpha-value>)",
        danger: "rgb(var(--ag-danger-rgb) / <alpha-value>)",
        warning: "rgb(var(--ag-warning-rgb) / <alpha-value>)",
        hairline: "var(--ag-hairline)",
        "hairline-bright": "var(--ag-hairline-bright)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "var(--ag-shadow-glow)",
        "glow-danger": "var(--ag-shadow-glow-danger)",
        panel: "var(--ag-shadow-panel)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 24s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
