import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // oslo.kommune.no farger
        "blue-light": "#b3f5ff",
        "blue-dark": "#1f42aa",
        "blue-darkdark": "00171a",
        "purple-dark": "#2a2859",
        "gray-light": "#f9f9f9",
        "gray-dark": "#212121",
        "gray-darkdark": "#1d1d1d",
        "yellow-medium": "#f9c66b",
        "black-kinda": "#0E0E0E",
      },
    },
  },
  plugins: [],
} satisfies Config;
