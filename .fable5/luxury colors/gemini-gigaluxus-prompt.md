# Feladat: "Gigaluxus" vizuális átállás — VisitKőszeg app

Teljes vizuális átöltöztetés az új luxus-palettára (éjkék + régi arany +
pergamen) és Apple-stílusú tipográfiára. A DÖNTÉSEK MEGSZÜLETTEK, a kapott
`gigaluxus-tokens.js` fájl a törvény — a végén lévő MIGRÁCIÓS TÉRKÉP minden
cserét definiál. NE hozz saját design-döntéseket. Ha egy eset nincs lefedve
a térképben, NE dönts: hagyd változatlanul és jelentsd a végén.

Branch: `refactor/gigaluxus`

## FÁZIS 0 — Alapozás
1. A `gigaluxus-tokens.js` `themeExtend` tartalmát olvaszd be a
   `tailwind.config.js` `theme.extend`-be. A korábbi brand/gold/borderRadius/
   boxShadow tokeneket ez FELÜLÍRJA (a régi indigo-alapú brand törlendő).
   Meglévő, más kulcsokat ne bánts.
2. A `globalCss` tartalmát fűzd hozzá a globális CSS belépési ponthoz
   (index.css vagy ekvivalens), a meglévő tartalom UTÁN.
3. Ha a projektben nincs Inter betöltve, add hozzá az index.html-hez:
   `<link rel="preconnect" href="https://rsms.me/">` és
   `<link rel="stylesheet" href="https://rsms.me/inter/inter.css">`
   (Apple-eszközökön úgyis a rendszer SF fut, az Inter a fallback.)
4. `npm run build` — hibánál állj meg.

## FÁZIS 1 — Színmigráció
Fájlonként, oldalanként külön commit. Sorrend: Home → Events → EventDetail →
Attractions → Parking → Gastronomy → Hotels → többi oldal → közös komponensek
(LiveHero, NearbyDiscoveryCard, SearchBar, PromoModal, FloatingNavbar, Footer,
App.jsx header).

A cseréket a gigaluxus-tokens.js MIGRÁCIÓS TÉRKÉPE szerint végezd. Kiemelten:
- MINDEN indigo-* → brand / brand-light / brand-soft (a térkép szerint)
- App-hátterek: bg-gray-50 → bg-surface-light; dark:bg-zinc-900 →
  dark:bg-surface-dark (FIGYELEM: az AnimatedRoutes.jsx PageWrapper
  className-jében is: `w-full bg-gray-50 dark:bg-zinc-900` →
  `w-full bg-surface-light dark:bg-surface-dark` — ez az EGYETLEN megengedett
  módosítás abban a fájlban, a style objektumhoz és a variantokhoz TILOS nyúlni)
- Kártya-hátterek: bg-white → bg-surface-card; kártyákon dark:bg-zinc-900 →
  dark:bg-surface-card-dark
- Arany: a #c8af64/#e4cc7d hexek → gold/gold-light tokenek. Az ARANY-SZABÁLY
  kötelező: teli arany háttér gombokon TILOS; kis arany szöveg világos
  háttéren = gold-text.

## FÁZIS 2 — Tipográfia
- Kártya/szekció címek: `font-extrabold uppercase tracking-wider` minta →
  `font-semibold tracking-display` normál esettel (uppercase eltávolítása,
  a szöveg tartalma NEM változik, csak a CSS)
- Minden `font-black` → `font-bold`
- uppercase KIZÁRÓLAG a 10-11px eyebrow/badge feliratokon marad, ott
  `tracking-widest font-semibold` egységesen
- Ár, dátum, számláló elemekre: `tabular-nums` (Tailwind: `tabular-nums` class)

## FÁZIS 3 — Fegyelmezés (glow-irtás, levegő)
- Töröld a dekoratív blur-glow elemeket. Konkrétan ismert: a Home SearchBar
  mögötti `bg-indigo-500/20 blur-xl` div (a teljes div törlendő, a SearchBar
  marad). Keresés: grep `blur-xl`, `blur-2xl`, `blur-3xl` — ami DÍSZÍTŐ
  (üres div, háttér-orb), törlendő; ami FUNKCIONÁLIS (backdrop-blur üvegek,
  képek blur-ölt háttere az EventDetail hero-ban), az MARAD.
- Színes shadow-k (shadow-indigo-*, shadow-[...rgba]) → shadow-card
- Kártya-padding emelés: `p-5` → `p-6`, `lg:p-6` → `lg:p-8` (csak kártyákon,
  gombokon nem); Home bento grid: `gap-3 md:gap-4` → `gap-4 md:gap-5`
- `whileHover` scale értékek: 1.02-nél nagyobb → 1.02

## FÁZIS 4 — Ellenőrzés
1. `npm run build` hibátlanul.
2. Grep — ezekre NEM lehet találat a src/-ben (kivéve AboutDetail.jsx,
   tailwind.config.js):
   `indigo-`, `#c8af64`, `#e4cc7d`, `#0e2f47`, `bg-gray-50`, `font-black`
3. ESLint a módosított fájlokra.
4. Összefoglaló: fájlonként cserék száma; a térképben nem szereplő,
   érintetlenül hagyott esetek listája (fájl + sor + érték); a törölt
   glow-elemek listája.

## SZIGORÚ MEGKÖTÉSEK
- AboutDetail.jsx: TILOS hozzányúlni.
- Framer-motion logika (layoutId, morph, scroll-scrub a Home-ban, PageWrapper
  variantok/transition/style): TILOS módosítani. A PageWrapper-ben kizárólag
  a Fázis 1-ben megjelölt két háttér-class cserélhető.
- Alkalmazás-logika (state, effect, fetch, routing): TILOS.
- Szövegek, fordítási kulcsok: TILOS átírni (az uppercase eltávolítása
  CSS-változás, nem szövegváltozás).
- Emerald/rose/amber rendszerszínek (élő badge, kedvenc szív, error):
  változatlanul maradnak.
- Új dependency az Inter CSS-linken kívül: TILOS.
- Fázisonként commit, értelmes üzenettel.
- Bizonytalanság esetén: nem döntesz, jelentesz.
