import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        fg: "#e8e4df",
        dim: "#6b6560",
        accent: "#c4b5a3",
        "accent-bright": "#f0e6d8",
        "card-bg": "#111110",
        "card-border": "#1f1e1c",
        hover: "#1a1918",
        "stamp-red": "#8b3a3a",
        blue: "#4a6fa5",
      },
      fontFamily: {
        display: ["'Newsreader'", "Georgia", "serif"],
        mono: ["'Space Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
