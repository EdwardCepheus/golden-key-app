/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#F5A623",
        accent: "#1A73E8",
        dark: {
          bg: "#0F1117",
          surface: "#1C1F27",
          border: "#2D3139",
        },
        text: {
          primary: "#E8EAED",
          muted: "#9AA0A6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
