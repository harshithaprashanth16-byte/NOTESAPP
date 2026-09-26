/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        academic: {
          green: "#00FF41",
          mint: "#8AFF9B",
          dark: "#000000",
          card: "#08080c",
          surface: "#0c0c12",
          border: "#27272a",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
