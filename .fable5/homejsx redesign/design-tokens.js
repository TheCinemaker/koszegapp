// ============================================================================
// VisitKőszeg design tokenek — tailwind.config.js `theme.extend` kiegészítés
//
// Ezt a blokkot kell beolvasztani a meglévő tailwind.config.js
// theme.extend objektumába. Ha ott már van colors/borderRadius/boxShadow,
// a kulcsokat össze kell fésülni, nem felülírni.
// ============================================================================

export const themeExtend = {
  colors: {
    // ------------------------------------------------------------------
    // BRAND: indigo-500 az alapszín. Direkt az indigo skálára mutat,
    // hogy a Tailwind beépített árnyalatai (indigo-50...950) továbbra is
    // használhatók maradjanak finomhangolásra.
    // ------------------------------------------------------------------
    brand: {
      DEFAULT: '#6366f1', // = indigo-500 — gombok, linkek, aktív állapot
      light: '#818cf8',   // = indigo-400 — dark mode-ban a brand szöveg/ikon
      soft: '#eef2ff',    // = indigo-50  — világos háttér-tint
      deep: '#1e1b4b',    // = indigo-950 — featured kártyák világos módban
      'deep-dark': '#171531', // featured kártyák dark módban (indigo-950-nél mélyebb)
    },

    // KIZÁRÓLAG a KőszegPass "prémium termék" jelölésére. Máshol tilos.
    gold: {
      DEFAULT: '#c8af64',
      light: '#e4cc7d',
    },
  },

  borderRadius: {
    control: '0.75rem', // 12px — gombok, inputok, kis vezérlők (volt: rounded-xl)
    card: '1rem',       // 16px — kártyák, grid elemek (volt: rounded-2xl)
    surface: '1.5rem',  // 24px — nagy felületek: jegy-kártya, modalok (volt: rounded-3xl)
  },

  boxShadow: {
    // Két szint elég: nyugvó kártya és lebegő elem. Minden más zaj.
    card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',                      // = shadow-sm
    floating: '0 25px 50px -12px rgb(0 0 0 / 0.25)',            // = shadow-2xl
  },
};

// ============================================================================
// MIGRÁCIÓS TÉRKÉP — a kódban található régi értékek → új tokenek
// (A Gemini migrációs prompt erre hivatkozik.)
//
//  RÉGI                                  ÚJ
//  ------------------------------------  --------------------------------
//  indigo-500 (bg/text/border)           brand  (bg-brand, text-brand...)
//  indigo-400 (dark mode szöveg)         brand-light
//  indigo-50 / indigo-500/10 tintek      brand-soft / brand/10
//  #123a57  (featured kártya)            brand-deep
//  #0e2c44  (featured kártya dark)       brand-deep-dark
//  #0a97be  (cyan hover, világos)        brand
//  #0bc9f8  (cyan kiemelés, sötét)       brand-light
//  #c8af64, #e4cc7d (KőszegPass arany)   gold, gold-light  (marad, tokenizálva)
//  purple gradientek (from-indigo to-purple)  sima bg-brand (gradient törlendő)
//
//  rounded-xl  (gomb/vezérlő)            rounded-control
//  rounded-2xl (kártya)                  rounded-card
//  rounded-3xl (nagy felület)            rounded-surface
//  rounded-lg / rounded-full             marad változatlanul
//
//  shadow-sm (kártyákon)                 shadow-card
//  shadow-2xl (modal, bubble)            shadow-floating
//  shadow-md, shadow-lg, shadow-xl       shadow-card-ra egyszerűsítendő
//  színes shadow-ok (shadow-indigo-500/20 stb.)  törlendők
// ============================================================================
