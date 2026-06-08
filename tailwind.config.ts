import type { Config } from "tailwindcss";

/**
 * Tailwind config — utility classes used sparingly for layout and spacing.
 * The visual design system lives in CSS variables (see src/styles/tokens.css)
 * so that the live "tweaks panel" can swap accent / dark / density without a rebuild.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", ".theme-dark"], // matches the design's <body class="theme-dark">
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // expose CSS variable colors as Tailwind tokens (so utilities like text-ink work)
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-mute": "var(--ink-mute)",
        "ink-faint": "var(--ink-faint)",
        amber: "var(--amber)",
        "amber-deep": "var(--amber-deep)",
        "amber-soft": "var(--amber-soft)",
        "amber-glow": "var(--amber-glow)",
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
} satisfies Config;
