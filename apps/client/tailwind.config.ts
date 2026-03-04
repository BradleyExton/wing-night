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
        gold: "#fbbf24",
        teamA: "#f97316",
        teamB: "#06b6d4",
        teamC: "#84cc16",
        teamD: "#f43f5e",
        teamE: "#facc15",
        teamF: "#14b8a6",
        teamG: "#60a5fa",
        teamH: "#fb7185"
      }
    }
  },
  plugins: []
};

export default config;
