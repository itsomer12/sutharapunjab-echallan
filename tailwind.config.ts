import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          page: "hsl(var(--surface-page))",
          inset: "hsl(var(--surface-inset))",
          card: "hsl(var(--surface-card))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          secondary: "hsl(var(--ink-secondary))",
          tertiary: "hsl(var(--ink-tertiary))",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
          focus: "hsl(var(--border-focus))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
          on: "hsl(var(--primary-on))",
          foreground: "hsl(var(--primary-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          subtle: "hsl(var(--danger-subtle))",
          text: "hsl(var(--danger-text))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          subtle: "hsl(var(--warning-subtle))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "calc(var(--radius) + 2px)",  /* 8px — modals only */
        md: "var(--radius)",               /* 6px — containers */
        sm: "calc(var(--radius) - 2px)",   /* 4px — inputs, buttons, badges */
      },
      fontSize: {
        "page-title": ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        "section": ["0.9375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "table-cell": ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
        "table-head": ["0.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
        "badge": ["0.75rem", { lineHeight: "1", fontWeight: "500" }],
        "button": ["0.875rem", { lineHeight: "1", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
export default config;
