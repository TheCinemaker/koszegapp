# Kőszeg Apps - Projects & Architecture Map

Ez a dokumentum segít átlátni a Kőszeghez kapcsolódó alkalmazások felépítését, a megosztott kódokat és a fejlesztési folyamatokat, hogy elkerüljük az összekeveredést.

---

## 🏛️ Alkalmazások Térképe

### 1. KőszegApp (Fő Alkalmazás)
* **Szerep**: A teljes városi app (Látnivalók, Események, Vendéglátás, Parkolás, Helyi játék, QR platform és a beágyazott Időjárás).
* **Mappa**: `/Users/thecinemaker/.gemini/antigravity/playground/koszegapp`
* **Git Repository**: [GitHub - TheCinemaker/koszegapp](https://github.com/TheCinemaker/koszegapp.git)
* **Adatbázis**: Supabase (fő projekt: események, éttermek, belépők stb.)
* **Telepítés**: Netlify (éles)

### 2. Kőszeg Weather PWA (Önálló Időjárás App - "Lacinak")
* **Szerep**: Egy teljesen önálló, dedikált Progressive Web App (PWA) kifejezetten az időjárási adatok, grafikonok és a helyi pillanatok (Reels/Moments) megjelenítésére.
* **Mappa**: `/Users/thecinemaker/.gemini/antigravity-ide/scratch/koszeg-weather-pwa`
* **Git Repository**: *Helyi Git inicializálva (`main` ág). GitHub feltöltésre vár.*
* **Adatbázis**: Supabase (külön projekt vagy dedikált táblák a Reels funkciónak)
* **Telepítés**: Netlify konfiguráció előkészítve (`netlify.toml`)

---

## 🔄 Megosztott Kódok és Szinkronizáció

Az Időjárás modul közös a két projektben. Ha az egyikben módosul, a változtatásokat át kell vezetni a másikba is.

| Modul / Fájl | KőszegApp helye | Weather PWA helye |
| :--- | :--- | :--- |
| **Dashboard UI** | `src/pages/WeatherDashboard/*` | `src/pages/WeatherDashboard/*` |
| **Weather API** | `src/api/weather.js` | `src/api/weather.js` |
| **Supabase kliens** | `src/lib/supabaseClient.js` | `src/api/supabase.js` |
| **Káromkodás szűrő** | `src/utils/badWordsHU.js` | `src/utils/badWordsHU.js` |

> [!IMPORTANT]
> **Szinkronizálási szabály**: Ha Claude vagy te módosítod a `src/pages/WeatherDashboard` mappát a Weather PWA-ban, azt másold át a Fő App megfelelő mappájába is (és fordítva), hogy a két felület szinkronban maradjon.

---

## ⚡ Aktuális Munkafolyamat & Feladatok

### Claude (háttérben végzett munka):
* Módosítások a dashboard fájlokon (grafikonok, stat kártyák finomhangolása).

### Antigravity (mi készítettük elő):
* Git repository inicializálása és első commit a standalone Weather PWA-ban.
* `netlify.toml` létrehozása (SPAs átirányítások és PWA cache szabályok).
* `.env.example` létrehozása a Supabase környezeti változókhoz (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Következő lépések (Te / Laci feladatai):
1. **GitHub tároló létrehozása**: Hozz létre egy új GitHub repót a weather appnak, és pushold fel a helyi `main` ágat.
2. **Supabase Migration futtatása**: Futtasd le a `supabase_migrations/01_create_reels.sql` fájlt a Supabase-en a képek tárolásához.
3. **Netlify összekötés**: Csatlakoztasd a GitHub repót a Netlify-hoz, és állítsd be a környezeti változókat.
