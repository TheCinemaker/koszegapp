# 📔 PROJEKT NAPLÓ - VISITKOSZEG.HU

Ebben a fájlban követjük a projekt haladását, az elvégzett módosításokat és a következő lépéseket. **Mielőtt bármihez hozzányúlsz, olvasd el!**

---

## 📅 2026. július 6. - Gyerekrajz (Kiosk Mode) Modul és Eseményszűrés

### 🎨 Gyerekrajz (Kids Drawing) – Kiosk Mode integráció
- [x] **[KioskDraw.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskDraw.jsx) [ÚJ]:** Készítettünk egy 60 FPS HTML5 Canvas alapú rajzoló alkalmazást 16 beépített színnel és 3 ecsetmérettel, gyerekbarát életkor-választóval és virtuális érintő-billentyűzettel a név/ország megadásához.
- [x] **[KioskDrawGallery.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskDrawGallery.jsx) [ÚJ]:** Létrehoztuk a Kioszk Gyermekgaléria oldalt a jóváhagyott rajzok böngészéséhez, lapozható elrendezéssel.
- [x] **[KioskDrawAdmin.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskDrawAdmin.jsx) [ÚJ]:** Elkészítettünk egy adminisztrációs jóváhagyó felületet a beküldött rajzok moderálására, a biztonságos `admin9730` belépőkóddal védve.
- [x] **[KioskHome.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskHome.jsx):** Integráltuk a rajzok és a galéria kártyáit a Kioszk Főoldal Bento-menüjébe (sűrűbb, szimmetrikus 10 csempés elrendezés), valamint bekötöttük a jóváhagyott rajzokat a képernyővédő (Standby) diavetítésébe, stílusos elmosott hátterű és alkotó-metadata kiírással.
- [x] **[KioskIdleWrapper.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/components/Kiosk/KioskIdleWrapper.jsx):** A rajzoló oldalon az inaktivitási időkorlátot 180 másodpercre növeltük, hogy a gyerekeknek elegendő idejük legyen befejezni a rajzaikat.
- [x] **[KioskShareQR.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/components/Kiosk/KioskShareQR.jsx):** Letiltottuk a lebegő QR-kód megosztó gombot a rajzoló, galéria és admin oldalakon, mivel ezek a funkciók kizárólag a kioszk terminálra készültek.
- [x] **[20260706_kiosk_kids_drawing.sql](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/supabase_migrations/20260706_kiosk_kids_drawing.sql) [ÚJ]:** Megírtuk a szükséges Supabase adatbázis sémát (kiosk_drawings tábla, RLS szabályok beszúráshoz/lekérdezéshez/módosításhoz anon és authenticated szerepköröknek is, valamint a storage bucket és annak biztonsági szabályai).
- [x] **Fordítások:** Kiegészítettük a **hu.js**, **en.js**, **de.js** kioszk nyelvi fájlokat a rajzoló, galéria és admin oldalak összes feliratával.

### 📅 Események lejárat-alapú szűrése a Kioszkon
- [x] **[KioskEvents.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskEvents.jsx):** Bevezettünk egy helyi időzónát követő dátumszűrést, így az Események oldalon a kioszk kizárólag a mai vagy a jövőbeli eseményeket listázza ki.
- [x] **[KioskVarszinhaz.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/Kiosk/KioskVarszinhaz.jsx):** Ugyanezt a lejárat-szűrést alkalmaztuk a Várszínház eseménylistájára is, elrejtve az összes múltbéli előadást.

---

## 📅 2026. június 24. - QR Admin és Menü Valós Idejű & Biztonsági Fixek

### ⚙️ Supabase Holtpontok és Web Locks Bypass
- [x] **[supabaseClient.js](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/lib/supabaseClient.js):** Bevezettük a `lock` no-op zárolás-megkerülést a Supabase kliensekhez, orvosolva a böngészős Web Locks holtpont-fagyásait (`locks.ts` / `AbortError`).

### 🛎️ Admin Rendeléskezelés és Teljesítmény Optimalizálás
- [x] **[qrService.js](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/api/qrService.js):** Átirányítottuk a `getActiveOrders`, `markItemServed`, `closeTable` és `acknowledgeWaiterCall` lekérdezéseket a `supabaseGuest` kliensre, teljesen kiküszöbölve az admin JWT token-frissítési fagyásait.
- [x] **[QRAdmin.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/QRPlatform/QRAdmin.jsx):** Finomítottuk a `handleServe` funkciót, hogy ne hívjon meg felesleges és lassú frissítéseket az összes asztali duplikált rendelésre, hanem csak arra az egy konkrét rendelésre, amelyre a pincér rákattintott.

### 📋 Élő Étlap szinkronizáció (Real-time Menu Updates)
- [x] **[QRMenu.jsx](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/src/pages/QRPlatform/QRMenu.jsx):** Feliratkoztattuk a vendégoldalt a `qr_menu_items` és `qr_menu_categories` táblák változásaira, valamint bevezettünk egy automatikus kosártisztítást a menet közben elfogyott tételekre.
- [x] **[20260624_fix_qr_rls.sql](file:///c:/Users/Szilveszter/.gemini/antigravity-ide/scratch/koszegapp/koszegapp/supabase_migrations/20260624_fix_qr_rls.sql) (Új SQL):** Létrehoztunk egy új adatbázis migrációs fájlt az RLS szabályok megnyitására (`FOR SELECT USING (true)`) és a `REPLICA IDENTITY FULL` beállítására a kategória és tétel táblákra. Ez biztosítja, hogy a Supabase Realtime ne dobja el az UPDATE/DELETE eseményeket a nem-elsődleges kulcs alapú szűréseknél (pl. `qr_restaurant_id`).

---

## 📅 2026. június 22. - Esemény Plakátok Megjelenítési Fixek

### 🖼️ Plakátok (Flyer-ek) Torzulásának és Levágásának Javítása
- [x] **EventDetail.jsx:** A korábbi `ParallaxImage` (`object-cover`) lecserélve egy kétkomponensű elrendezésre: egy homályosított háttérkép (`blur-3xl`) és egy éles előtérkép (`object-contain`) kombinációjára, így a teljes plakát látszódik cropping nélkül.
- [x] **Events.jsx:** A kártyákon a képtárolót fix `aspect-[3/2]` arányra formáltuk, és azon belül a plakátokat a fenti homályos háttér + `object-contain` sémára alakítottuk át, megakadályozva a rácsszerkezet elcsúszását és a képek levágását.
- [x] **Varszinhaz.jsx:** A Várszínház kártyáinál is bevezettük a homályos háttér + `object-contain` technikát a fix `aspect-[4/5]` konténeren belül.

---

## 📅 2026. június 11. - SEO, Biztonság, Hozzáférhetőség és Kódszétvágás Fixek

### 🔍 SEO & Közösségi Előnézet (Open Graph)
- [x] **Netlify Edge Function (`seo-optimizer.js`):** Létrehozva a Deno-alapú edge funkció, ami a kéréseket lefülelve automatikusan és villámgyorsan behelyettesíti a helyes Open Graph (`og:title`, `og:description`, `og:image`) és Twitter Card meta tageket a bots/crawlers kéréseihez, a Supabase-ből lekérve a dinamikus étterem és esemény adatokat (így működik a Facebook/Twitter megosztás előnézete).
- [x] **Regisztráció:** Konfigurálva a `netlify.toml`-ben az Edge Function futtatása a dokumentum kérésekhez (kivéve a statikus asseteket).

### 🌐 Domain Javítások (Robots.txt & Sitemap & SEO)
- [x] **robots.txt & sitemap.xml:** Minden nem létező `koszeg.app` domain hivatkozás lecserélve a helyes `visitkoszeg.hu`-ra, megelőzve az NXDOMAIN hibát a keresőmotoroknál.
- [x] **SEO.jsx:** A `BASE_URL` konstans átírva a helyes domainre.

### 🛡️ Időjárás API Biztonság (OpenWeatherMap)
- [x] **Weather Proxy Netlify Function (`weather-proxy.js`):** Létrehozva egy backend proxy funkció az OpenWeatherMap hívásokhoz, így a privát API kulcs kikerült a kliens oldali JS bundle-ből.
- [x] **Hibrid kliens-oldali integráció (`weather.js`):** A központi lekérő funkció átírva, hogy a proxyt használja, de tartalmaz egy automatikus fallback logikát közvetlen hívásra, ha helyi fejlesztésben a Netlify CLI proxy nem fut. A KioskHeader, WeatherModal és ProgramModal komponensek átirányítva a proxyra.

### ⚡ Kódszétvágás és Bundle optimalizálás
- [x] **App.jsx importok tisztítása:** Eltávolítva 23 darab nem használt statikus lap importálás (Home, Attractions, Events, stb.), amelyek blokkolták a Vite beépített kódszétvágását (code-splitting). Ennek köszönhetően a fő JS bundle mérete töredékére csökkent, a lapok (pl. ARView ~3.2MB, FoodAdmin ~520KB, TicketScanner ~340KB) külön chunkokba kerültek, amiket a vendég csak szükség esetén tölt le.
- [x] **ProvidersPage lazy load:** Átalakítva dinamikus importtá az `AnimatedRoutes.jsx`-ben.

### ♿ WCAG és Hozzáférhetőség
- [x] **Viewport nagyítás:** Az `index.html`-ből eltávolítva a `maximum-scale=1.0` és `user-scalable=no` korlátozás, így a gyengébben látó és idősebb turisták szabadon nagyíthatják az oldalt mobilról.

### 🖼️ Lazy Képbetöltés Fix
- [x] **MutationObserver a DOM helyett:** Az `index.html`-ben lévő statikus `DOMContentLoaded` esemény lecserélve egy dinamikus `MutationObserver` alapú megoldásra, ami a React által futásidőben felcsatolt (mounted) képeket is sikeresen észleli, és ellátja a `loading="lazy"` attribútummal.

---

## 📅 Utolsó frissítés: 2026. április 16.

### 🎯 Jelenlegi fókusz: DIGITÁLIS PINCÉR (QR PLATFORM) ÉLESÍTÉSE
A legfontosabb cél a QR alapú asztali rendelési rendszer finomhangolása és az admin felület villámgyors működése.

---

## ✅ Elvégezve (Összefoglaló)

### 🚀 Infrastruktúra és Beállítások
- Portok tisztítása és a fejlesztői szerver elindítása a **localhost:3000**-es porton.
- `vite.config.js` frissítve a port 3000 használatára.

### 📢 Marketing Előkészületek (Folyamatban, de most másodlagos)
- `marketing/` mappa létrehozva a gyökérben.
- Facebook teaserek és pitch anyagok legenerálva (titokzatos, "teaser" stílus).
- Grafikák és poszttervek elhelyezve a marketing mappában.

### 💇 Időpontfoglalás (Booking)
- [x] **ProvidersPage UI Egységesítés:** Kategória csempék a dashboard stílusában (2 oszlopos elrendezés mobilon, modern ikonok, üveghatás).
- [x] **Hamarosan feliratok törölve:** Minden csempéről eltávolítva.
- [x] **Szolgáltató kártyák finomítása:** Kompaktabb design, felesleges feliratok és címek törölve. Random színátmenetes logók minden cégnek.
- [x] **Görgetés javítása:** Kategória választáskor az oldal automatikusan a tetejére ugrik.
- [x] **Apple-stílusú foglalás gomb:** Prémium megjelenésű, kerekített gombok.
- [x] **BookingModal UI finomítás:**
  - Kompaktabb fejléc (cím és felesleges ikonok eltávolítva).
  - Szűkített naptársáv (pontosan 1 hét fér el).
  - Átláthatóbb, egysoros megjegyzés rovat.
- [x] **Foglalás lemondása:** Ha a felhasználó rákattint a "Saját (sárga)" időpontjára, a megjelenő elegáns Modalból a foglalást véglegesen is tudja törölni az adatbázisból, így az időpont mindenkinek azonnal újra felszabadul. A rendszer biztosítja a Hard Delete működését az engedélyezett felhasználók számára.
- [x] **BusinessDashboard Névtelen Foglalások Javítása (400 HTTP fix):** A szolgáltató ismét látja az új foglaló nevét! Mivel az adatbázis (Supabase) FK kapcsolat hibát dobott a profilok táblával egy lekérdezésben és a realtime értesítésekben is, készítettünk egy áthidalást: Foglaláskor a vendég nevét a `notes` elejéhez fűzzük, a Dashboard pedig kiolvassa és címként jeleníti meg, a lekérdezéseket optimalizálva.
- [x] **Új Foglalás Értesítő és Kommunikáció:** Amikor a szolgáltató megkapja a felugró értesítést (modal) egy új valós idejű foglalásról, kap egy "Válasz írása ✉️" gombot. A beküldött válasz a KőszegApp belső `messages` táblájába kerül mentésre, lehetővé téve a valós idejű, de eltűnő (időpont lejárta után érvénytelenné váló) üzenetváltást.
- [x] **Azonnali Üzenetküldés Kiterjesztése:** A szolgáltató neve automatikusan fűződik a válaszaihoz, így a kliens a `UserMessageRibbon`-on azonnal látja a feladó üzlet nevét, anélkül hogy szerver oldali adatbázis módosításra lett volna szükség (Supabase relációk áthidalása).
- [x] **Naptár Kibővítése és Gyors-ugrás:** A vendég oldali naptárcsík 7 napos limitációja eltörölve, 90 napra előre generálja a görgethető gombokat! Egy beépített fix Naptár Icon (Date Picker) segítségével hónapokat ugorhatnak egy gombnyomással.
- [x] **Seamless Login technikai ellenőrzés:** Átirányítási logika ellenőrizve és javítva.
- [x] **UI csiszolás:** A foglalási slots (időpontok) vizuális visszajelzései (szabad/foglalt/saját) finomítva.

---

## 🛠️ Folyamatban lévő feladatok

### 💇 Időpontfoglalás (Booking)
- [ ] **Ütemezés és Naptár vizuális finomítása:** Az idősávok és a napválasztó stílusának további csiszolása (Apple-style design).
- [ ] **Foglalási visszaigazolás:** Értesítések és visszaigazoló emailek ellenőrzése (ha szükséges).

### 🍔 Eats (Ételrendelés)
- [x] **Heti és Állandó Menü Rendszer Integráció:** Áttérés a szimpla napi menüről az átfogó Heti Menü és az új, minden nap rendelhető **"Állandó Napi Menü (A/B)"** logikára. A `FoodAdmin` felületen az éttermek heti bontásban és állandó fix mezőként is vihetik fel az ajánlatokat. Mind a Heti, mind az Állandó menühöz **ár szabható**.
- [x] **Menük Kosárba Rakása és Adatbázis Fix:** Az admin által beárazott Napi/Állandó menük a Vendégoldalon egy kattintással kosárba rakhatóak. A kosár adatbázisba szinkronizálásakor a custom azonosítókat a rendszer futásidőben kiveszi (UUID parse PostgreSQL error fix), így az összes rendelés stabilan lefut.
- [x] **Rendelés Követés (Státuszok) és Fizetés Finomítása:** A felhasználói oldalon kizárólag a Készpénzes fizetés maradt aktív (többi teszt gomb elrejtve). A státusz feliratok átírásra kerültek ('Rendelés leadva', 'Futár úton 🛵', 'Kiszállítva ✅'). A Kiszállítva státusz mostantól pontosan 3 percig látható marad a usernek, majd automatikusan eltűnik (a korábbi azonnali villanás/eltűnés bugja orvosolva dupla háttérszál eltávolításával).
- [x] SuperAdmin pénzügyi modul (bevétel, jutalék, grafikon)
- [x] KőszegEats branding és bizonylat nyomtatás
- [x] **"ELFOGYOTT" funkció és FoodAdmin UI optimalizálás (V2)**
    - Heti menü szerkesztő (7 napos bontás) áthelyezése az Étlap fülre.
    - Villogó effektek teljes eltávolítása (user kérésre).
    - Vendégoldali "ELFOGYOTT" szalag (ribbon) az ételeken.
    - Valós idejű készletkezelés és azonnali frissülés.

## 📅 2026. március 31. - Operatív Finomhangolás
### 2026.03.31 - Napi Menü (A/B/C) Rendszer és Realtime Sync
- **Strukturált Napi Menü:** Bevezetésre került a Leves + A/B/C variációs rendszer. Mostantól több opciót is megadhat az étterem.
- **Kettős Árazás:** Támogatás a "Levessel" és "Leves nélkül" árakhoz.
- [x] Phase 3: Verification & Polish
    - [x] Run verification tests for "Eats" (Flash Sale, Mystery Box, Sold Out)
    - [x] Create walkthrough documentation for Flash Sale
    - [x] **Implement Personal Pickup (Collection) Option**
    - [x] **Implement Live Order Tracker UI (Status-based)** for "Booking" (Calendar, Login)
- **Marketing Funkciók Élesítése:** A Mystery Box (Ételmentés) és Flash Sale (Villámakció) szakaszok visszakerültek a vendégoldalra.
- **Flash Sale Bővítés:** Mostantól a főoldali étteremlistában is láthatóak a Villámakciók (⚡ színezett kapszula), nem csak az étterem saját lapján.
- **Full Realtime Sync Fix:** Javítva az a hiba, ahol az étterem belső nézetében nem frissültek azonnal a marketing elemek. Egy `useRef` alapú megoldással most már minden változtatás (Mystery Box, Flash Sale be/kikapcsolás) azonnal megjelenik a már bent lévő vendégeknél is.
- **Bugfix (Persztencia):** Az "Összes elfogyott" és "Állandó menü elérhető" gombok javítva. Mostantól a `display_settings` mezőbe mentődnek, így stabilan és realtime frissítik a vendégoldalt.
- **Flash Sale Banner:** Új, látványos animált ⚡ ikon (villogás nélkül) az éttermek fejlécében, ha aktív az akció.
- **Realtime "Elfogyott" Toggles:** Az adminban állított "Elfogyott" állapot azonnal megjelenik a vendégoldalon (piros szalaggal és letiltott kosár gombbal).
- **Admin UI Finomítás:** A "VAN" és "ELÉRHETŐ" állapotjelző gombok zöld színt kaptak a jobb olvashatőség érdekében.
- **Automatikus Elrejtés:** Ha egy adott napra nincs beírva menü tartalom, a szakasz automatikusan elrejtődik a vendégek elől.
- **Teszt Adat Generátor:** Beépítettünk egy "Teszt Adatok Betöltése" gombot a FoodAdmin felületre a gyors kipróbáláshoz.
- **No-Pulse Policy:** Minden villogó és pulzáló (`animate-pulse`) animációt véglegesen eltávolítottam. A felület stabil és zavarmentes.
1. **Étlap UI**: A teljes 7 napos menüszerkesztő átkerült az Étlap fülre a "Sürgős Módosítások" szekcióba.
2. **Villogásmentesítés**: Minden pulzáló/villogó effektust eltávolítottam a kezelői és a vendég oldalról is.
3. **Elfogyott szalag**: Az elfogyott ételek mostantól egy elegánsabb, piros átlós szalagot kapnak a vendégoldalon.
4. **Hírek és Akciók**: Rövidített mezők a gyors napi üzenetekhez közvetlenül az étlap felett.
- [x] **Havi Elszámolási Logika:** Bevezetve a havi bontású szűrő, ami alapján havonta követhető a forgalom. Beépítve a "Számla kiállítása" és a "Megérkezett" (befizetés igazolása) funkciók a Supabase backenddel összekötve.
- [x] **Vizuális Analitika (Grafikon):** Egyedi 6-hónapos trend grafikon került a SuperAdmin felületre a platform növekedésének követéséhez.
- [x] **Előfizetési Modell:** Megalkotva a Sima (5k) és Tabletes (15k) csomagok szerkeszthető rendszere.
- [x] **Biztonság és RLS:** A Supabase adatbázis felkészítve az anonim SuperAdmin hozzáférésre (szigorúan korlátozott olvasási jogokkal az orders/invoices táblákra).
- [x] **Blokknyomtatás Fix:** A számla PDF generátor immár kezeli a speciális magyar karaktereket (ő/ű -> ö/ü) és lerövidített, olvasható azonosítókat használ.

---
**Aktuális Státusz (2026. 03. 30.):**
A pénzügyi és elszámolási motor 100%-os, elindulhat a Pizzéria éles tesztje. A foglalási modul fixálása a következő lépés a tesztelési fázis után.

---

## ⚠️ Fontos figyelmeztetések
- **Jegyértékesítés:** SOHA ne nyúlj a számlázási és jegyvásárlási rendszerhez! (Lásd: `IMPORTANT_SYSTEM_NOTICE.md`)
- **Nyelv:** Minden kommunikáció és naplózás MAGYARUL történik.
- **Port:** Az app a 3000-es porton fut (HTTPS).

---

## ⏭️ Következő technikai lépések
1. `BookingModal.jsx` átnézése: a belépés gomb redirect URL-jének ellenőrzése.
2. Tesztelés: Bejelentkezetlen felhasználóként megpróbálni foglalni, belépni, és ellenőrizni, hogy visszaugrik-e a modalhoz.
3. Foglalási visszaigazoló és státusz frissítések ellenőrzése.

---
**Legutóbbi Fejlesztés (2026. 03. 31.): Okos Flash Sale**
- **Termékenkénti Akciók:** Az adminban minden étel mellé került egy "🔥 Flash" gomb, ahol egyedi szabályok állíthatók be.
- **Támogatott Típusok:**
    - `% kedvezmény`: Pl. -20% csak az adott pizzára.
    - `1+1 (BOGO)`: Minden második darab 0 Ft a kosárban.
    - `Ajándék termék`: Automatikus ajándék tétel (pl. üdítő) hozzáadása a kosárhoz 0 Ft-ért.
- **Százalékos Kerekítés**: A százalékos kedvezményeknél keletkező tizedesjegyeket a rendszer egész forintra kerekíti (Math.round), elkerülve a tört összegeket. A BOGO akciók az eredeti egységárakkal kerülnek rögzítésre.
- **Fizetési Hiba Fix (UUID)**: Az ajándék termékek és napi menük egyedi azonosítói nem feleltek meg az adatbázis UUID formázásának, ami megakasztotta a rendelést. Bevezettünk egy Regex alapü validálást a `foodService.js`-ben, ami ezt orvosolja.
- **Visszaélés elleni védelem**: A `foodService.js` a rendelés leadásakor újra lekéri a szerverről az aktuális akciós szabályokat. Így ha egy user a kosarában hagy egy akciós termékeket, de az akció időközben lejár, a rendszer automatikusan az eredeti árakkal rögzíti a rendelést, megakadályozva a kijátszást.
- **Frontend Figyelmeztetés**: Ha a kosárban lejárt akciós tétel van, a rendszer a fizetés előtt egy narancssárga figyelmeztető üzenetben jelzi a változást a vendégnek, és automatikusan frissíti a végösszeget.
- **Személyes Átvétel Opció**: A korábbi "Elvitel" funkciót átneveztük és pontosítottuk. A vendég mostantól egyértelműen választhatja a helyszíni átvételt a futár helyett.
- **Élő Rendeléskövető (Multi-Tracker)**: Az új, animált folyamatjelző mostantól többidejű rendeléseket is tud kezelni. Ha a vendég több helyről rendel, mindegyikhez külön tracker jelenik meg.
- **Folyamatjelző Finomhangolás**: Kompaktabb, "Apple-style" megjelenés. Az étterem neve bekerült a fejlécbe, az állapot-logika pedig javítva lett (az "Elfogadva" státusz is már a "Készül" fázist aktiválja).
- **Folyamatjelző Perzisztencia**: A lezárt (kiszállított/törölt) rendelések 10 percig láthatóak maradnak egy statikus zöld jelzéssel, segítve a visszajelzést.
- **Manuális Bezárás**: Minden tracker kapott egy 'X' gombot, amivel a vendég bármikor eltüntetheti a lezárt folyamatokat.
- **Seamless Login Redirect**: Kijavítva az a hiba, ahol a KőszegPass-os belépés után a user a profillapon maradt. Mostantól a rendszer visszairányít a KőszegEats (vagy az eredeti) oldalra a sikeres bejelentkezés után.
- **Tracker Perzisztencia & Időzítés**: A lezárt rendelések láthatósága 1 percre csökkentve (a korábbi 10 helyett). Az elrejtés mostantól `localStorage` alapon működik, így oldalfrissítés után sem térnek vissza a bezárt tracker kártyák.
- **Valós idejű Készletkezelés**: Kijavítva az a hiba, ahol az elfogyott termékek eltűntek az oldalról. Mostantól minden termék látható marad "Elfogyott" jelzéssel, és a készletváltozások (elérhetőség) azonnal, frissítés nélkül megjelennek a felhasználónál a Supabase Realtime segítségével.
- **Sync on Resume & Syntax Fix**: Implementálva az iPhone-os kényszerített frissítés (visibilitychange), valamint javítva a buildet akadályozó szintaktikai hiba a `FoodOrderPage.jsx` fájlban. A kód most már stabil és építhető.
- **Időzített Menü (Napi & Állandó)**: Bevezetve az időalapú láthatóság. Mostantól mind a napi, mind az állandó menü csak a megadott sávban (pl. 11:00-14:00) látható és rendelhető. Az Állandó Menü mostantól szigorúan a Napi Menü meglététől és engedélyezésétől függ, az UI pedig egységesített listaként jelenik meg.
- **Hírek / Közlemények**: Az éttermi nézetben megjelent egy vizuális banner, amely az admin által megadott aktuális híreket/közleményeket jeleníti meg.
- **Kosár Validáció (Lejárt Menü Blokkolás)**: Implementálva egy kritikus biztonsági ellenőrzés a `CartDrawer`-ben. Ha a vendég menüidőben tesz be ételt a kosárba, de csak később akar fizetni (amikor a menü már nem elérhető), a rendszer blokkolja a rendelést és figyelmeztetést ad.
- **Vizuális Visszajelzés:** Az akciós ételek egyedi badge-et kaptak az étlapon, az ajándékokat pedig külön tételként jelzi a rendszer.
- **Git Push**: A teljes modul (időzítések, készletkezelés, iPhone fixek, dokumentáció) stabil állapotban feltöltve a GitHub-ra. Élesítésre kész. 🚀🏆✨

### Következő Tervezett Lépések:
- **Admin Dashboard**: Globális bevételi nézet és tranzakciós statisztikák finomhangolása.
- **Booking Login**: A foglalási folyamat "Seamless Login" rendszerének tökéletesítése.

---

---

## 📅 2026. április 15-16. - Digitális Pincér és Teljesítmény Fixek

### 🪑 Digitális Pincér (QR Platform)
- [x] **Teljes Modul Implementáció:** Standalone asztali rendelési felület (`/menu/:res/:table`) és Pincér Admin (`/menu-admin`).
- [x] **Képfeltöltési Rendszer:** 
    - Kliens oldali tömörítés implementálva (max 1200px, JPEG 0.85).
    - Izolált Supabase Storage (`qr-platform` bucket) konfigurálva.
    - Étterem-specifikus mappa-struktúra és RLS biztonság.
- [x] **Többkörös Rendelés:** Bevezetve az egyedi UID alapú tételkezelés, így a pincér látja, ha az asztal ugyanabból a sörből kér egy újabb kört (nem keveredik össze a már felszolgálttal).

### ⚡ Teljesítmény Optimalizálás (Performance V3)
- [x] **AppInit Bypass:** A QR oldalak betöltésekor kihagyjuk a nehéz globális adatletöltéseket, így az étlap szinte azonnal megjelenik mobilon is.
- [x] **Admin Dashboard Re-render Fix:** 
    - Izoláltuk a visszaszámláló időzítőt, így nem rajzolódik újra az egész oldal másodpercenként.
    - Az asztallista adatfeldolgozását `useMemo`-ba zártuk.
    - A gombokat és kártyákat `memo` és `useCallback` segítségével optimalizáltuk a PC-s Chrome "tetű lassú" működésének megszüntetésére.

### 🗺️ Rendszer-térkép (Navigation)
- [x] **APP_STRUCTURE.md:** Létrehoztunk egy központi térképet, ami tartalmazza az összes publikus és adminisztrátori URL-t, funkcióval és hozzáféréssel együtt.

---

## 📅 2026. április 14. - Arculatváltás és Stabilitási Fixek
### 🎯 Brand Átállás: visitkoszeg.hu
- **Teljes Átnevezés:** A "KőszegAPP" márkanév minden felületről (főoldal, admin, dokumentáció, PDF generátorok) lecserélve a modern **visitkoszeg** (vagy visitKőszeg) elnevezésre.
- **Kivétel:** Az email cím (`koszegapp@gmail.com`) érintetlen maradt a szervermigrációig.

### 🚀 Betöltési Stabilitás és Hibajavítás
- **"Üres képernyő" hiba elhárítása:** Implementálva egy globális **ErrorBoundary**, ami megakadályozza, hogy egy Javascript hiba miatt elsötétüljön az oldal. Helyette egy „Oldal újratöltése” gomb jelenik meg.
- **Resilient Loading:** Az `App.jsx`-ben bevezetésre került a `Promise.allSettled` és egy **5 másodperces biztonsági időzítő**. Ha a Supabase vagy egy JSON fájl lassú, az app akkor is elindul, nem várakozik örökké.
- **FoodOrderPage fallback:** Az ételrendelés oldalon beépített időzítők jelzik, ha lassú az azonosítás vagy az étteremlista betöltése, és felajánlják a frissítést.
- **Git Push:** Minden stabilitási és arculati módosítás sikeresen feltöltve a `main` ágra.


