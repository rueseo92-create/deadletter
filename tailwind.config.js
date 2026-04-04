/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
          800: "#312E81",
          900: "#1E1B4B",
          container: "#6366F1",
          fixed: "#E0E7FF",
          "fixed-dim": "#A5B4FC",
        },
        secondary: {
          DEFAULT: "#0891B2",
          50: "#ECFEFF",
          container: "#06B6D4",
          fixed: "#CFFAFE",
          "fixed-dim": "#67E8F9",
        },
        tertiary: {
          DEFAULT: "#8B5CF6",
          container: "#A78BFA",
          fixed: "#EDE9FE",
          "fixed-dim": "#C4B5FD",
        },
        error: { DEFAULT: "#DC2626", container: "#FEE2E2" },
        surface: {
          DEFAULT: "#FAFBFD",
          dim: "#E2E8F0",
          bright: "#FAFBFD",
          "container-lowest": "#ffffff",
          "container-low": "#F1F5F9",
          container: "#E2E8F0",
          "container-high": "#CBD5E1",
          "container-highest": "#94A3B8",
        },
        outline: { DEFAULT: "#64748B", variant: "#CBD5E1" },
        "on-surface": { DEFAULT: "#0F172A", variant: "#475569" },
        "on-primary": { DEFAULT: "#ffffff", fixed: "#1E1B4B", "fixed-variant": "#3730A3" },
        "on-secondary": { DEFAULT: "#ffffff", fixed: "#164E63", "fixed-variant": "#0E7490", container: "#0891B2" },
        "on-error": "#ffffff",
        background: "#FAFBFD",
      },
      fontFamily: {
        headline: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08)",
        "glow": "0 0 40px rgba(79,70,229,0.12)",
        "glow-lg": "0 0 80px rgba(79,70,229,0.18)",
        "inner-ring": "inset 0 0 0 1px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-right": "slide-out-right 0.25s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.3s ease-out forwards",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [],
};
