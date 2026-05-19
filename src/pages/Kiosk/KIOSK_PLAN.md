# Kiosk Fejlesztési Terv & Állapotdokumentáció

> **Munkamegosztás:** Claude Sonnet + Gemini Flash párhuzamosan dolgoznak.  
> **Scope:** CSAK `src/components/Kiosk/` és `src/pages/Kiosk/` + `src/locales/kiosk/` + `src/contexts/KioskLangContext.jsx`  
> **TILOS:** fizetési rendszer, Apple/Google Wallet generátorok, főapp fájlok módosítása

---

## Prioritáslista & Állapot

| # | Feladat | Hatás | Állapot |
|---|---------|-------|---------|
| 1 | HU / EN / DE nyelvi felület | Kritikus | ✅ KÉSZ |
| 2 | Napsütéses / high-contrast mód | Kritikus (outdoor!) | ✅ KÉSZ |
| 3 | "Vidd magaddal" QR minden oldalon | Nagy | ✅ KÉSZ |
| 4 | Praktikus infók (WC, ATM, taxi) | Nagy | ✅ KÉSZ |
| 5 | Valódi fotók a bento tile-okon | Közepes | ⬜ TODO |
| 6 | Térkép | Közepes | ✅ KÉSZ |
| 7 | Page transition animáció | Kis csiszolás | ⬜ TODO |

---

## Kész munka részletesen

### 1. HU / EN / DE Nyelvi Felület ✅

**Architektúra:**
- `src/contexts/KioskLangContext.jsx` — React Context, `lang` state, `setLang()`, `t('key.path')` fordítás
- `src/locales/kiosk/hu.js` / `en.js` / `de.js` — nested JS objektumok az összes statikus UI szöveghez
- Nyelv `localStorage`-ben tárolódik (`kiosk-lang` kulcson), kiosk újraindítás után is megmarad
- `KioskLangProvider` a `KioskIdleWrapper`-ben wrapper, így minden `/kiosk/*` route hozzáfér

**Locale kulcsszerkezet:**
```
common, header, screensaver, home, attractions, attractionDetail,
parking, gastronomy, events, eventDetail, selfie, varszinhaz
```

**Fontos részletek:**
- Az időjárás API (`OpenWeatherMap`) `lang=hu/en/de` paraméterrel újra hívódik nyelcváltáskor
- A napok neve `dayIndex` (0–6) int-ként tárolódik, renderkor `t('header.days.N')` fordítja le
- `KioskSelfie.jsx` `frames` tömbje `React.useMemo(..., [t])` — a canvas szöveg is frissül nyelvváltáskor
- Esemény nevek/leírások szándékosan maradnak magyarban (JSON dinamikus tartalom)

**SVG zászlók (Windows emoji fix):**
- `src/components/Kiosk/KioskFlag.jsx` — inline SVG zászlók (HU/EN/DE), emoji helyett
- Windows 11-en a Unicode regional indicator karakterek nem renderelnek zászlóként
- `<KioskFlag code="hu" className="w-5 h-3.5" />` — szélességet/magasságot kívülről kapja

**Nyelcváltó helyek:**
- `KioskHeader.jsx` — jobb oldal, minden belső oldalon látható
- `KioskHome.jsx` screensaver — alsó sávban, `e.stopPropagation()`-nel izolálva (ne indítsa el a kioszkot)

---

## Fájlszerkezet

```
src/
├── components/Kiosk/
│   ├── KioskIdleWrapper.jsx   — idle timeout + KioskLangProvider wrapper
│   ├── KioskHeader.jsx        — sticky header, óra, időjárás, back gomb, nyelcváltó
│   └── KioskFlag.jsx          — inline SVG zászlók (HU/EN/DE)
├── pages/Kiosk/
│   ├── KioskHome.jsx          — főmenü bento grid + screensaver attract-loop
│   ├── KioskAttractions.jsx   — látnivalók listája (távolság alapján rendezve)
│   ├── KioskAttractionDetail.jsx — egy látnivaló részletei
│   ├── KioskEvents.jsx        — általános eseménylista (2 oszlopos grid)
│   ├── KioskEventDetail.jsx   — esemény részlet + TheTicket QR kártya (Supabase soft-link)
│   ├── KioskVarszinhaz.jsx    — Várszínház szezon, kereső + hónapszűrő
│   ├── KioskParking.jsx       — parkolási zónák + automata térkép
│   ├── KioskGastronomy.jsx    — éttermek/borozók (távolság alapján)
│   └── KioskSelfie.jsx        — webkamera + canvas képeslap + Supabase upload + QR letöltés
├── contexts/
│   └── KioskLangContext.jsx
└── locales/kiosk/
    ├── hu.js
    ├── en.js
    └── de.js
```

---

## Következő feladatok részletezve

### 2. Napsütéses / High-Contrast Mód ✅

**Implementáció:**
- `KioskLangContext.jsx` — `highContrast` state (localStorage `kiosk-contrast`), `toggleContrast()`, `useEffect` → `html[data-kiosk-hc="1"]` attribútum + `.dark` osztály eltávolítása
- `src/components/Kiosk/kiosk-contrast.css` (új) — CSS overrides: `backdrop-filter: none`, opaque kártya hátterek, erősebb borderek, magasabb szövegkontraszt
- `KioskIdleWrapper.jsx` — importálja a CSS-t
- `KioskHeader.jsx` — `IoSunnyOutline` toggle gomb (sárga = aktív), dark mode timerek `highContrast` esetén kihagyva

**Működés:** Ha HIGH-CONTRAST bekapcsol → eltűnik a blur, átlátszó üveg háttarak tömörré válnak, light mode kényszer. Ha kikapcsol → KioskHeader újra értékeli az automatikus dark mode-ot (21:00–06:00).

---

### 3. "Vidd magaddal" QR minden oldalon ✅

**Implementáció:**
- `src/components/Kiosk/KioskShareQR.jsx` (új) — floating button (jobb alsó sarok, `z-[200]`) + modal (`z-[250]`)
- URL logika: `/kiosk/events/123` → `https://visitkoszeg.hu/events/123` (levágjuk a `/kiosk` prefixet)
- `qrcode` csomag generálja a QR data URL-t (220px, fekete-fehér)
- 10 másodperces auto-close visszaszámlálóval, kívülre kattintva is bezárul
- Screensaver közben nem jelenik meg (`sessionStorage.getItem('kiosk-started') !== 'true'`)
- `KioskIdleWrapper.jsx`-ben van renderelve → automatikusan minden kiosk oldalon megjelenik
- Fordítások: `share.button`, `share.title`, `share.desc` (HU/EN/DE)

---

### 4. Praktikus infók (WC, ATM, taxi) ✅
Új oldal: `/kiosk/services`

**Megvalósítás részletei:**
- **Valós kőszegi adatok**: Csak és kizárólag érvényes, létező szolgáltatások és koordináták szerepelnek (bezárt Tourinform iroda sikeresen kihúzva!).
- **Távolság és sétaidő**: A termináltól vett Haversine távolság alapján rendezi és jeleníti meg a helyeket, gyalogos sétaidő-kalkulátorral (80 m/perc).
- **Hívás-szimulátor**: Telefonszámmal ellátott szolgáltatásoknál (Taxi, Orvosi ügyelet) egy gyönyörű, animált hívás-szimulációs modal segíti a felhasználókat.
- **Tökéletes lokalizáció**: Teljesen lefordított kulcsok a `hu.js`, `en.js` és `de.js` szótárakban.
- **Bento Tile**: Szimmetrikus violet-to-indigo gradienssel ellátott főoldali Bento Grid kártya.

---

### 5. Valódi fotók a bento tile-okon (Közepes)
A `KioskHome.jsx` bento grid kártyái jelenleg ikon + gradient háttérrel működnek.

**Javasolt megközelítés:**
- Minden `menuItem`-hez `bgImage` prop hozzáadása
- CSS: `background-image` + `bg-cover bg-center` + sötét gradient overlay az ikonok/szöveg fölé
- Képek: `public/images/kiosk/` mappába (selfie, varszinhaz, events, gastronomy, attractions)
- Fallback: ha nincs kép, marad a jelenlegi gradient

---

### 6. Térkép (Közepes)
Interaktív térkép a látnivalók/parkolók/éttermek jelölésével.

**Javasolt megközelítés:**
- `Leaflet.js` + `react-leaflet` — könnyű, offline cache-elhető tile-okkal
- A főapp `LiveCityMap.jsx` és `ParkingDetailMap.jsx` már Leaflet-et használ — koordináták és stílus ott látható
- Kiosk térkép: `/kiosk/map` route, `KioskMap.jsx`
- Marker kategóriák: látnivalók (kék), parkolók (narancssárga), éttermek (zöld), WC/ATM (szürke)
- Kiosk pozíció: `KIOSK_LAT/LNG` = `47.388451, 16.542002` (Fő tér 7.)

---

### 7. Page Transition Animáció (Kis csiszolás)
Oldalak közötti smooth átmenet.

**Javasolt megközelítés:**
- `framer-motion` — ha már telepített a főappban
- Alternatíva: Tailwind `animate-fadeIn` osztály (már használatban van néhány oldalon)
- Wrapper: `KioskPageTransition.jsx` — `<motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}`
- `KioskIdleWrapper.jsx`-ben globálisan alkalmazható

---

## Technikai Korlátok & Megjegyzések

- **Kiosk URL-ek:** `/kiosk`, `/kiosk/attractions`, `/kiosk/events`, `/kiosk/events/:id`, `/kiosk/gastronomy`, `/kiosk/varszinhaz`, `/kiosk/parking`, `/kiosk/selfie`
- **Kiosk pozíció:** `KIOSK_LAT = 47.388451`, `KIOSK_LNG = 16.542002` (Fő tér 7., Portré Étterem mellett)
- **Supabase:** `ticket_events` tábla soft-link az esemény részleteknél (név egyezés alapján)
- **Idle timeout:** `KioskIdleWrapper` kezeli, `kiosk-idle-trigger` custom event váltja vissza a screensavert
- **Storage izolálás:** Kiosk saját localStorage kulcsokat használ (`kiosk-lang`, `kiosk-started`)
- **Fordítás scope:** Csak statikus UI szöveg. Esemény nevek/leírások JSON-ból jönnek, szándékosan magyarok.
- **`formatDistance(meters, nearText)`** — második param opcionális fordítható "itt van melletted" szöveg
