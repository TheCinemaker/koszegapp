# Feladat: Supabase-vezérelt promo modal rendszer integrálása (visitkoszeg.hu)

Egy React + Vite + Tailwind + Supabase + Netlify stackű turisztikai PWA-ban dolgozol.
Két kész fájlt kapsz, ezeket kell beilleszteni a repóba, és a Home.jsx-ből ki kell
takarítani a régi, hardcode-olt promo logikát. NE tervezd újra a komponenst, a kapott
kódot használd; csak az integrációhoz szükséges minimális módosításokat végezd el.

## Kapott fájlok

1. `PromoModal.jsx` → helye: `src/components/PromoModal.jsx`
2. `promos.sql` → NEM kerül a repóba futtatandó kódként; tedd `supabase/migrations/`
   alá vagy `docs/sql/` mappába referencia céljából. (A táblát a Supabase SQL
   Editorban kézzel futtatjuk le, ezt ne automatizáld.)

## Elvégzendő lépések

### 1. PromoModal beillesztése
- Másold be a `PromoModal.jsx`-et a `src/components/` mappába.
- Ellenőrizd az importokat a projekt tényleges struktúrája szerint:
  - a supabase kliens itt: `../lib/supabaseClient` — ha a repóban máshol van,
    igazítsd az import útvonalat.
  - `react-i18next`, `framer-motion`, `react-icons/io5`, `react-router-dom` már
    használatban vannak a projektben, új csomagot NE telepíts.

### 2. Home.jsx takarítás
A `src/pages/Home.jsx`-ben (vagy ahol a Home komponens van):
- TÖRÖLD a teljes "Múzeumok Éjszakája" promo logikát:
  - a `showPromo` state-et,
  - a `useEffect`-et, ami a 2026. június 20-i dátumot ellenőrzi,
  - a `closePromo` függvényt,
  - a JSX végén lévő teljes `<AnimatePresence>` blokkot a promo modallal,
  - a csak ehhez használt importokat (pl. ha a `AnimatePresence` máshol nem kell
    a fájlban, azt is — de ELŐTTE ellenőrizd, hogy tényleg nem használja más).
- ADD HOZZÁ: `import PromoModal from '../components/PromoModal';`
- A Home JSX gyökerében, a záró tag előtt helyezd el: `<PromoModal />`

### 3. Ellenőrzés
- `npm run build` fusson le hibátlanul.
- Futtasd az ESLint-et a módosított fájlokra; unused import ne maradjon.
- Grep-elj rá a repóban a `museumNightPromoShown` stringre — sehol ne maradjon
  hivatkozás.

## Fontos megkötések

- A PromoModal hibatűrő: ha a `promos` tábla még nem létezik vagy a lekérés
  hibázik, csendben nem jelenít meg semmit. Ezt a viselkedést NE változtasd meg,
  a Home soha nem törhet el a promo miatt.
- A sessionStorage kulcs formátuma `promo_shown_{uuid}` — ne írd át, a
  promónkénti megjelenítés-számlálás erre épül.
- Ne nyúlj a Home többi részéhez (LiveHero, SearchBar, bento grid, morph
  animációk), kizárólag a promo-blokk cseréje a feladat.
- Semmilyen új dependency, semmilyen Tailwind config módosítás nem szükséges.

## A rendszer működése (kontextusnak)

- A `public.promos` tábla RLS-e csak az aktív, időablakban lévő promókat adja
  vissza anonim klienseknek, ezért a kliensoldali query-ben nincs external
  dátumszűrés — ez szándékos.
- Új kampány élesítése: egy INSERT a Supabase dashboardon, deploy nélkül.
  A `content` jsonb mező nyelvenkénti objektumokat tartalmaz
  (`hu` kötelező, `en`/`de` opcionális), a komponens az i18n aktuális
  nyelvéhez igazodik `hu` fallbackkel.
