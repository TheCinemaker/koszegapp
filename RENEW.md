# 🚀 RENEW Projekt Napló & Design Rendszer Szabvány

Ez a projektnapló rögzíti a KőszegApp **RENEW** megújulási folyamata során az elfogadott és véglegesített design változtatásokat.

---

## 📐 ELFOGADOTT GLOBÁLIS DESIGN TOKENEK

### 1. Elsődleges Márka Szín Token (Brand Accent Color)
- **Akció & Ikon Szín:** **`bg-indigo-500`** (`#6366F1`)
- **Hover Állapot Szabvány:** **`hover:opacity-90`** (minden `bg-indigo-500` gombnál és interaktív elemnél a 90%-os áttetszőségű hover visszajelzést használjuk színváltás helyett)
- **Kiemelt Szöveg:** **`text-indigo-500 dark:text-indigo-400`**
- **Árnyék:** **`shadow-indigo-500/25`** / **`shadow-indigo-500/30`**

### 2. Betöltési Szabvány ÉS Animáció Szabály ("NEM VILLOGTATUNK SEMMIT!")
- **Forgó Lekerekített Négyzet Spinner:** `<div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin" />`
- **Betöltő Szöveg:** Szigorúan **STATIKUS**, nem villogó, kis méretű szöveg: `<p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-3 tracking-wide">Betöltés...</p>` (tilos az `animate-pulse` vagy bármilyen villogás a szövegeken!).
- **Újrafelhasználható Komponens:** `src/components/LoadingSpinner.jsx`.

### 3. Border Radius (Lekerekítés) Tokenek (16px / rounded-2xl)
| Szint | Token Név | Tailwind Osztály | Pixeles Megfelelő | Használati Útmutató |
|---|---|---|---|---|
| **Elsődleges Külső Kártya / Konténer** | Primary Radius | `rounded-2xl` | `16px` (`1rem`) | Fő Bento grid csempék, LiveHero kártya, NearbyDiscovery kártya, FloatingNavbar konténer, Kereső konténer és lebegő menük, fő oldali szekció wrappers. |
| **Belső Elemek / Interaktív Gombok** | Secondary Radius | `rounded-xl` | `12px` | Kártyán belüli időjárás gomb, belső akció gombok, kereső input mező, keresési találati lista elemei. |
| **Ikonok / Mikro Kártyák** | Micro Radius | `rounded-lg` | `8px` | Bento csempék ikon hátterei, apró jelvények. |
| **Pirulák / Badgek / Státusz Jelzők** | Full Radius | `rounded-full` | `9999px` | Kategória tagek, LIVE NOW jelvények, modális bezáró gombok, módváltó gombok. |
| **Óriás Modális Ablakok / Dialogok** | Dialog Radius | `rounded-3xl` | `24px` | Képernyő közepén megjelenő kiemelt promóciós kártyák és felugró ablakok. |

### 4. Anyagok és Glassmorphic Stílusok
- **Standard Bento Csempe Felület:** `bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-[20px] backdrop-saturate-[1.6]`
- **Kiemelt Csempe Felület (Ostromnapok / Várszínház):** `bg-[#123a57] dark:bg-[#0e2c44] border border-white/10 text-white`
- **Tipográfiai HIERARCHIA:**
  - Címek / Fejlécek: `text-slate-900 dark:text-white font-extrabold uppercase tracking-wider`
  - Alcímek / Leírások: `text-slate-500 dark:text-gray-400 font-semibold`

---

## 📝 VÁLTOZTATÁSI NAPLÓ ÉS ELŐZMÉNYEK

### 2026-07-21 #008 - Beállítások Modál (SettingsMenu.jsx) & Apple SF Pro Tipográfia [ELFOGADVA]
- A Beállítások menü megszüntette az áttetszőséget, Letisztult, szilárd popover hátteret kapott (`bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl rounded-3xl`).
- A gombok, nyelvváltoztatók és gombkapcsolók az egységes `indigo-500` márkaszínt és `rounded-xl` / `rounded-3xl` rádiuszokat használják.
- **Apple SF Pro Tipográfia Szabvány:** Beállítottuk a hivatalos Apple San Francisco és Inter betűtípus-készletet (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Inter", system-ui, sans-serif`) szubpixel élesítéssel (`-webkit-font-smoothing: antialiased`).

### 2026-07-21 #007 - Kedvencek Modál (FavoritesDashboard.jsx) Átdolgozás [ELFOGADVA]
- Megszüntettük az átmosott áttetsző hátteret, a modál most szilárd, kontrasztos hátteret kapott (`bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl`).
- A fejléc ikon és a darabszám jelvény az egységes `indigo-500` márkaszínre és a szív ikonra (`FaHeart` / `IoHeart`) váltott.
- A modál konténere a `rounded-3xl` (24px / Dialog Radius), a belső kiskártyák a `rounded-2xl` (16px / Primary Radius) szabványt követik.

### 2026-07-21 #006 - Élő Térkép (/live-map) & Parkolási Térkép Bento Csempe Elrendezés [ELFOGADVA]
- A teljes képernyős kilógás megszűnt, a térkép most szigorúan a lekerekített **`rounded-2xl` (16px)** Bento csempén belül fut (`overflow-hidden`, `border`, `shadow-2xl`).
- A visszagomb összenyomódása megszűnt (`shrink-0 w-11 h-11`), kattintásra biztonságosan navigál vissza.
- A keresőmező, az alsó felugró lap és a popupek az egységes `rounded-xl` és `rounded-3xl` rádiuszokat, valamint a `bg-indigo-500` / `hover:opacity-90` márkaszíneket használják.

### 2026-07-21 #005 - Betöltő Spinner és Animációs Szabály (NEM Villogtatunk!) [ELFOGADVA]
- Létrehoztuk az egységes `LoadingSpinner.jsx` komponenst forgó lekerekített négyzettel (`rounded-2xl animate-spin border-indigo-500`).
- Szigorúan megtiltottuk a szövegek villogtatását (`animate-pulse`), a betöltés feliratok statikus, kis méretű szöveggel jelennek meg (`Betöltés...`).

### 2026-07-21 #004 - Hover Állapot Véglegesítése (hover:opacity-90) [ELFOGADVA]
- Véglegesítettük a **`hover:opacity-90`** szabványt minden `bg-indigo-500` gombnál és interaktív elemnél.

### 2026-07-21 #003 - Indigó Márkaszín Token (bg-indigo-500) [ELFOGADVA]
- Beállítottuk a pontos márkaszínt: **`bg-indigo-500`** az ikonokhoz és gombokhoz.

### 2026-07-21 #002 - Radius Token Finomítás (16px / rounded-2xl) [ELFOGADVA]
- A lekerekítéseket a letisztultabb **`rounded-2xl` (16px)** elsődleges szabványra igazítottuk.

### 2026-07-21 #001 - RENEW Projekt Napló Indítása
- Elkészült a `RENEW.md` projektnapló.
