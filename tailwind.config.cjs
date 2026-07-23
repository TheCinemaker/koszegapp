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
        brand: {
          DEFAULT: '#0e2f47', // Primary brand color requested by user
          light: '#1e486b',
          soft: '#eef4f8',
          deep: '#0a2234',
          'deep-dark': '#061724',
        },
        indigo: {
          500: '#0e2f47',
          600: '#0a2234',
          700: '#1e486b',
        },
        gold: {
          DEFAULT: '#c8af64',
          light: '#e4cc7d',
        },
        beige: {
          50: "#f9f5f1",
          100: "#f2e9e1",
          200: "#e9d8c9"
        }
      },
      borderRadius: {
        control: '0.75rem', // 12px (rounded-xl)
        card: '1rem',       // 16px (rounded-2xl)
        surface: '1.5rem',  // 24px (rounded-3xl)
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        floating: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "SF Pro", "Outfit", "sans-serif"],
        zeyada: ['Zeyada', 'cursive'] 
      }
    }
  },
  plugins: []
};
