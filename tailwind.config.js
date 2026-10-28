/** @type {import('tailwindcss').Config} */

// 모든 색상은 app/globals.css 의 CSS 변수(RGB 채널)에서 온다.
// 라이트/다크 전환은 prefers-color-scheme 으로 변수만 바뀌므로 dark: 변형이 거의 필요 없다.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        subtle: v("subtle"),
        line: { DEFAULT: v("line"), strong: v("line-strong") },
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        accent: {
          DEFAULT: v("accent"),
          strong: v("accent-strong"),
          soft: v("accent-soft"),
          fg: v("accent-fg"),
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"JetBrains Mono"',
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      maxWidth: {
        measure: "68ch",
        page: "72rem",
      },
      letterSpacing: {
        tightish: "-0.012em",
        tighter2: "-0.028em",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-down": "slide-down 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
