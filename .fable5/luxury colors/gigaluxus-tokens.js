// ============================================================================
// VisitKőszeg "GIGALUXUS" design tokenek — v2
// Éjkék + régi arany + pergamen | Apple-éles tipográfia
//
// KÉT RÉSZ:
//   A) tailwind.config.js theme.extend kiegészítés
//   B) index.css kiegészítés (font-rendering + bázis-stílusok)
// ============================================================================

// ----------------------------------------------------------------------------
// A) tailwind.config.js → theme.extend
// ----------------------------------------------------------------------------
export const themeExtend = {
  colors: {
    brand: {
      DEFAULT: '#0b2740',     // ÉJKÉK — fő gombok, featured felületek, linkek
      deep: '#071b2e',        // még mélyebb réteg — dark mode featured felület
      light: '#8fb3d1',       // dark mode-ban a kék szöveg/ikon/link
      soft: '#e9eef4',        // világos kék-tint háttereknek
    },

    gold: {
      DEFAULT: '#b3985e',     // RÉGI ARANY — ikonok, borderek, aktív állapot
      light: '#d4bc85',       // dark mode arany (sötét háttéren ez ragyog jól)
      // FIGYELEM: kis szöveghez világos háttéren a sima gold kontrasztja
      // kevés (WCAG AA bukó). Kis méretű arany SZÖVEGHEZ ezt használd:
      text: '#8a7340',        // sötétített arany — világos háttéren olvasható
      soft: '#f3ede0',        // arany-tint háttér (pl. kiemelt sorok)
    },

    surface: {
      light: '#f6f4ef',       // PERGAMEN — az app világos háttere (gray-50 helyett)
      card: '#fffdf9',        // kártyák világos módban (tiszta fehér helyett meleg)
      dark: '#0d0e10',        // majdnem-fekete app-háttér dark módban (zinc-900 helyett)
      'card-dark': '#16171a', // kártyák dark módban (zinc-900 helyett)
    },
  },

  fontFamily: {
    // Apple-stack: minden Apple-eszközön az SF Pro rendszerfontot kapja
    // (ez maga a "retina-éles" — natív hinting, optikai méretezés),
    // máshol Inter esik be, ami a legjobb SF-közeli alternatíva.
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
  },

  letterSpacing: {
    // Az Apple-look kulcsa: NAGY méretben negatív tracking (tight),
    // KIS méretben enyhén pozitív. A display méretekhez:
    display: '-0.025em',
  },

  borderRadius: {
    control: '0.75rem',
    card: '1rem',
    surface: '1.5rem',
  },

  boxShadow: {
    card: '0 1px 2px 0 rgb(11 39 64 / 0.06)',
    floating: '0 25px 50px -12px rgb(11 39 64 / 0.25)',
    // Az egyetlen megengedett "csillogás": hajszálvékony arany belső perem
    // a featured elemekre. Használat: shadow-gold-line
    'gold-line': 'inset 0 0 0 1px rgb(179 152 94 / 0.35)',
  },
};

// ----------------------------------------------------------------------------
// B) index.css (vagy a globális CSS belépési pont) kiegészítés
//    — ettől lesznek "brutál élesek" a betűk
// ----------------------------------------------------------------------------
export const globalCss = `
/* ===== GIGALUXUS bázis-tipográfia ===== */

html {
  /* Subpixel helyett grayscale antialias — Apple-eszközökön ez az éles */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  /* Inter fallback esetén az SF-hez közelítő beállítások */
  font-feature-settings: 'ss01' on, 'cv11' on; /* Inter: nyitott számok, SF-szerű formák */
  font-optical-sizing: auto;
}

/* Nagy címek: az élesség fele a tight tracking + a súly fegyelme */
h1, h2 {
  letter-spacing: -0.025em;
  font-weight: 650; /* variable fontnál finomabb, mint a bold — Inter/SF tudja */
}

/* Számok (árak, dátumok, statisztikák) mindig tabular — nem ugrál semmi */
.tabular, [data-numeric] {
  font-variant-numeric: tabular-nums;
}
`;

// ----------------------------------------------------------------------------
// MIGRÁCIÓS TÉRKÉP — jelenlegi állapot → gigaluxus
//
//  SZÍNEK
//  ------------------------------------------------------------------
//  indigo-500 (minden előfordulás)      brand  (bg/text/border-brand)
//  indigo-400 (dark mode)               brand-light
//  indigo-50 / indigo tintek            brand-soft
//  #0e2f47 (ha valahol megmaradt)       brand
//  bg-gray-50 (app háttér)              bg-surface-light
//  dark:bg-zinc-900 (app háttér)        dark:bg-surface-dark
//  bg-white (kártyákon)                 bg-surface-card
//  dark:bg-zinc-900 (kártyákon)         dark:bg-surface-card-dark
//  #c8af64 / #e4cc7d (régi arany)       gold / gold-light
//
//  ARANY-SZABÁLY (kritikus!):
//  - arany HÁTTÉR teli gombon/nagy felületen: TILOS
//  - arany ikon, 1px border, badge-keret, aktív állapot: IGEN
//  - arany kis szöveg világos háttéren: gold-text (a sötétített változat)
//  - arany dark módban: gold-light
//
//  TIPOGRÁFIA
//  ------------------------------------------------------------------
//  font-extrabold + uppercase + tracking-wider (kártyacímek)
//      → font-semibold, normál eset (NEM uppercase), tracking-display
//  font-black (mindenhol)               font-bold
//  uppercase marad: KIZÁRÓLAG a 10-11px eyebrow/badge feliratokon,
//      ott tracking-widest + font-semibold
//
//  FEGYELMEZÉS
//  ------------------------------------------------------------------
//  - Minden blur-glow dekoráció törlendő (SearchBar mögötti glow,
//    blur-xl/blur-3xl díszítő orbok)
//  - Színes shadow-k törlendők; kártya = shadow-card, lebegő = shadow-floating
//  - Kártya-padding: p-5 → p-6 (lg:p-6 → lg:p-8); grid gap-3 → gap-4
//  - hover: scale marad, de 1.02 fölé soha
// ============================================================================
