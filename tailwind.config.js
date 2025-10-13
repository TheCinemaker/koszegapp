/** @type {import('tailwindcss').Config} */
const { heroui } = require('@heroui/react');
module.exports = {
  darkMode: 'class',

  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: "#f9f5f1",
          100: "#f2e9e1",
          200: "#e9d8c9"
        },
        purple: {
          100: "#52a5dd2e",
          300: "#5cb9f8",
          600: "#2788C9",
          700: "#52a5dd",
          800: "#52a5dd",
          900: "#52a5dd"
        },
        indigo: {
          500: "#52a5dd",
          600: "#2788C9",
          700: "#5ebdfe",
          800: "#bde5ff",
          900: "#52a5dd"
        },
        rose: {
          50: "#545454"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        zeyada: ['Zeyada', 'cursive'] 
      }
    }
  },
  plugins: []
};
