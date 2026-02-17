import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#121212",
        surface: "#1c1c1c",
        surfaceAlt: "#242424",
        text: "#ffffff",
        muted: "#a3a3a3",
        primary: "#f97316",
        heat: "#ef4444",
        success: "#22c55e",
        danger: "#dc2626",
        gold: "#fbbf24"
      }
    }
  },
  plugins: []
};

export default config;
