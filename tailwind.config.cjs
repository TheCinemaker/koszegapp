/** @type {import('tailwindcss').Config} */
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
          100: "#0bc9f82e",
          300: "#0bc9f8",
          600: "#0a97be",
          700: "#3385a2",
          800: "#3385a2",
          900: "#123a57"
        },
        indigo: {
          500: "#123a57",
          600: "#0a97be",
          700: "#0bc9f8",
          800: "#0bc9f8",
          900: "#123a57"
        },
        rose: {
          50: "#545454",
          500: "#d68743",
          600: "#b36022",
          700: "#b36022"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "SF Pro", "sans-serif"],
        zeyada: ['Zeyada', 'cursive'] 
      }
    }
  },
  plugins: []
};
