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
          DEFAULT: '#0b2740',     // ÉJKÉK — fő gombok, featured felületek, linkek
          deep: '#071b2e',        // még mélyebb réteg — dark mode featured felület
          light: '#8fb3d1',       // dark mode-ban a kék szöveg/ikon/link
          soft: '#e9eef4',        // világos kék-tint háttereknek
        },
        gold: {
          DEFAULT: '#b3985e',     // RÉGI ARANY — ikonok, borderek, aktív állapot
          light: '#d4bc85',       // dark mode arany
          text: '#8a7340',        // sötétített arany — világos háttéren olvasható
          soft: '#f3ede0',        // arany-tint háttér
        },
        surface: {
          light: '#f6f4ef',       // PERGAMEN — az app világos háttere
          card: '#fffdf9',        // kártyák világos módban
          dark: '#0d0e10',        // majdnem-fekete app-háttér dark módban
          'card-dark': '#16171a', // kártyák dark módban
        },
        beige: {
          50: "#f9f5f1",
          100: "#f2e9e1",
          200: "#e9d8c9"
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        zeyada: ['Zeyada', 'cursive'] 
      },
      letterSpacing: {
        display: '-0.025em',
      },
      borderRadius: {
        control: '0.75rem', // 12px
        card: '1rem',       // 16px
        surface: '1.5rem',  // 24px
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(11 39 64 / 0.06)',
        floating: '0 25px 50px -12px rgb(11 39 64 / 0.25)',
        'gold-line': 'inset 0 0 0 1px rgb(179 152 94 / 0.35)',
      },
    }
  },
  plugins: []
};
