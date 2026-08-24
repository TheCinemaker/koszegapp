# Feladat: Design token migráció — VisitKőszeg app (React + Vite + Tailwind)

Az app vizuálisan széttartott: többféle brand szín, három rádiusz-skála, ötféle
árnyék él egymás mellett. A cél az egységesítés az alábbi token-rendszerre.
A DÖNTÉSEK MÁR MEGSZÜLETTEK, a te dolgod a mechanikus, hűséges végrehajtás.
NE hozz saját design-döntéseket, NE "javíts" mást, csak amit a fázisok előírnak.

Két kapott fájl:
- `design-tokens.js` — a tailwind.config kiegészítés + a teljes migrációs térkép
- `ui.jsx` — közös UI komponensek, helye: `src/components/ui.jsx`

## FÁZIS 0 — Előkészítés
1. Hozz létre új git branch-et: `refactor/design-tokens`
2. Másold be a `ui.jsx`-et `src/components/ui.jsx` néven.
3. Olvaszd be a `design-tokens.js`-ben lévő `themeExtend` tartalmát a
   `tailwind.config.js` `theme.extend`-jébe. Meglévő kulcsokkal FÉSÜLD össze,
   ne írd felül őket. A `design-tokens.js` fájl maga NEM kerül a buildbe,
   tedd `docs/` alá referenciaként.
4. `npm run build` — ha itt hiba van, állj meg és jelezd.

## FÁZIS 1 — Színmigráció (a design-tokens.js térképe szerint)
Fájlonként haladj, oldalanként külön committal. Sorrend:
`Home.jsx` → Events lista → `EventDetail.jsx` → Attractions → többi oldal →
közös komponensek (LiveHero, NearbyDiscoveryCard, SearchBar, PromoModal stb.)

Cserék (a teljes térkép a design-tokens.js végén):
- Minden `indigo-500` utility → `brand` (pl. `bg-indigo-500` → `bg-brand`,
  `text-indigo-500` → `text-brand`, `border-indigo-500/20` → `border-brand/20`,
  `selection:bg-indigo-500` → `selection:bg-brand`)
- `indigo-400` (dark mode) → `brand-light`
- `#123a57` → `brand-deep`; `#0e2c44` → `brand-deep-dark`
- `#0a97be` → `brand`; `#0bc9f8` → `brand-light`
- `#c8af64` → `gold`; `#e4cc7d` → `gold-light`
- indigo→purple gradientek (`from-indigo-* to-purple-*`) → sima `bg-brand`
- Minden egyéb, listán nem szereplő hex-et NE cserélj, hanem gyűjtsd össze
  és a végén jelentsd (fájl + sor + érték).

## FÁZIS 2 — Rádiusz-migráció
- `rounded-xl` → `rounded-control` (gombokon, inputokon, kis vezérlőkön)
- `rounded-2xl` → `rounded-card` (kártyákon)
- `rounded-3xl` → `rounded-surface` (modalokon, nagy felületeken)
- `rounded-lg`, `rounded-full`, és az irányított változatok
  (pl. `rounded-r-2xl` → `rounded-r-card`) értelemszerűen.
- KIVÉTEL: az `src/pages/AboutDetail.jsx` (About oldal) — ahhoz NE nyúlj
  egyáltalán, az később külön lesz kezelve.

## FÁZIS 3 — Árnyék-diéta
- Kártyákon: `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl` → `shadow-card`
- Lebegő elemeken (modal, toast, bubble): `shadow-2xl` → `shadow-floating`
- Színes árnyékok (pl. `shadow-indigo-500/20`, `shadow-[0_4px_25px_rgba(...)]`)
  → töröld, helyette sima `shadow-card`.
- `hover:shadow-lg` → `hover:shadow-floating` CSAK a Home bento kártyáin,
  máshol töröld a hover-árnyékot.

## FÁZIS 4 — Komponens-kivonás (csak a nyilvánvaló esetek)
Cseréld le a kézzel épített mintákat a `ui.jsx` komponenseire, DE csak ott,
ahol a csere 1:1 és nem változtat viselkedést:
- 44px kör gombok (vissza/kedvenc/bezárás) → `<IconButton>` ill.
  `<IconButton variant="glass">` a kép fölötti változatnál
- uppercase pill címkék → `<Badge tone="...">`
- eyebrow feliratok → `<SectionLabel>`
Ha egy előfordulás eltér a mintától (extra prop, más méret), HAGYD BÉKÉN
és jelentsd a végén.

## FÁZIS 5 — Ellenőrzés
1. `npm run build` hibátlanul.
2. ESLint a módosított fájlokra, unused import nem maradhat.
3. Grep-ellenőrzés — ezekre NEM lehet találat a src/-ben
   (kivéve AboutDetail.jsx és a ui.jsx/tailwind.config definíciói):
   `#123a57`, `#0e2c44`, `#0a97be`, `#0bc9f8`, `#c8af64`, `#e4cc7d`,
   `indigo-500`, `from-indigo`, `to-purple`
4. Írj rövid összefoglalót: fájlonként hány csere, mik maradtak ki és miért,
   a Fázis 1-ben gyűjtött ismeretlen hexek listája.

## SZIGORÚ MEGKÖTÉSEK
- Framer-motion animációkhoz, layoutId-khez, morph-transitionökhöz TILOS nyúlni.
- Logikát (state, useEffect, fetch, routing) TILOS módosítani.
- Új dependency TILOS.
- Szövegeket, fordítási kulcsokat TILOS átírni.
- Az AboutDetail.jsx-hez TILOS nyúlni.
- Ha bármiben bizonytalan vagy, NE dönts: hagyd változatlanul és jelentsd.
- Fázisonként külön commit, értelmes commit message
  (pl. `refactor(tokens): Home.jsx color migration`).
