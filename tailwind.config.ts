import type { Config } from "tailwindcss";

/**
 * Tailwind reads design tokens from CSS custom properties declared in
 * app/globals.css so the warm/energetic palette stays the single source of
 * truth. Colors are wired through `var(--...)` to keep runtime theming open.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        primary: {
          DEFAULT: "var(--color-primary)",
          fg: "var(--color-primary-fg)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          fg: "var(--color-accent-fg)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      /*
       * Soft-weight remap for the "warm earthy lifestyle" direction: headings
       * should read at ~500, never 700. Remapping the scale keeps every existing
       * font-bold/semibold/extrabold class soft without touching each file.
       */
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "500",
        bold: "500",
        extrabold: "600",
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        raised: "var(--shadow-raised)",
      },
      maxWidth: {
        app: "var(--app-max-width)",
      },
    },
  },
  plugins: [],
};

export default config;
