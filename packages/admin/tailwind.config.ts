/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        investec: {
          // Core palette (95%)
          "navy-900": "#0F2030",
          "navy-800": "#172D45",
          "navy-700": "#1E3A5F",
          "navy-500": "#3D6B8E",
          "navy-300": "#6B9FC9",
          stone: "#B8AFA6",
          "sky-300": "#7DD3FC",
          white: "#FFFFFF",
          // Accent palette (5%)
          teal: "#00A5B5",
          burgundy: "#8B3A5E",
          amber: "#D4A843",
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
