/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // Martabak Warm Orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        crust: {
          50: "#fbf8f3",
          100: "#f5eee4",
          200: "#ebddc9",
          300: "#dec6a7",
          400: "#cfab83",
          500: "#be9063",
          600: "#ad7a50",
          700: "#8e6040",
          800: "#744f37",
          900: "#604230",
          950: "#342217", // Dark Brown / Chocolate
        },
      },
    },
  },
  plugins: [],
};
