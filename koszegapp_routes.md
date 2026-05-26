# KőszegApp - Teljes Oldaltérkép és Elérhetőségek

Az alábbi lista az alkalmazás összes jelenlegi útvonalát (URL-jét) tartalmazza. 
Mindegyik elérése: `http://localhost:3000[útvonal]` (pl. `http://localhost:3000/eats`)

### 🚀 1. Főoldalak és Városi Felfedezés
* **`/`** – Applikáció Főoldala
* **`/attractions`** – Látványosságok listája
* **`/attractions/:id`** – Egy konkrét látványosság részletei
* **`/events`** – Városi eseménynaptár
* **`/events/:id`** – Konkrét esemény részletei
* **`/gastronomy`** – Gasztronómiai térkép és lista
* **`/gastronomy/:id`** – Étterem/Kávézó adatlapja
* **`/hotels`** – Szállások
* **`/hotels/:id`** – Konkrét szálláshely
* **`/leisure`** – Szabadidő (pl. túrázás, sport)
* **`/leisure/:id`** – Szabadidős program részletei
* **`/weather`** – Élő időjárás
* **`/live-map`** – Élő, interaktív okostérkép
* **`/parking`** – Parkolási zónák
* **`/parking-map`** – Parkolótérkép
* **`/parking/:id`** – Konkrét parkoló infó
* **`/moments`** – "Pillanatok" közösségi feed
* **`/info`** és **`/about`** – Általános infók és Rólunk
* **`/showcase`** – A gigamenő, frissen elkészült Apple-stílusú Feature Showcase
* **`/teaser`** – Teaser / Bevezető oldal
* **`/nearby-demo`** – Helyalapú felfedezés demó

### 🎫 2. Jegyrendszer (Ticket System)
* **`/tickets`** – Jegyvásárlási felület
* **`/tickets/success`** – Sikeres vásárlás / Visszaigazolás
* **`/tickets/scanner`** – Jegyolvasó alkalmazás kapusoknak
* **`/tickets/admin`** – Jegyrendszer adminisztráció *(Belépés Supabase fiókkal / Admin jogosultsággal)*
* **`/tickets/print/:ticketId`** – Megvásárolt jegy PDF / Nyomtatható nézet
* **`/varszinhaz`** – Dedikált Kőszegi Várszínház céloldal

### 🍔 3. KőszegEats (Ételrendelés)
* **`/eats`** – Ételrendelő platform (fogyasztóknak)
* **`/eats-landing`** – Eats bemutató céloldal
* **`/eats-admin`** – Éttermi felület (beérkező rendelések kezelésére) *(Belépés a `/eats-auth` felületen keresztül)*
* **`/eats-auth`** – Éttermi dolgozó bejelentkezés
* **`/eats/print/:orderId`** – Rendelés konyhai blokk nyomtatása

### 🍷 4. Digitális Pincér (QR Menü)
* **`/menu/:restaurantId/:tableId`** – A vendég asztalánál megnyíló interaktív rendelő felület
* **`/menu-admin`** – A pincérek/pultosok tabletes felülete *(Supabase auth alapú bejelentkezés a felületen belül)*

### 💎 5. Kőszeg Quest (AR Kincskereső Játék)
* **`/game/intro`** – Játék bevezetője
* **`/game/intro-experience`** – Immerzív bevezető élmény
* **`/game/start`** – Játék indítása
* **`/game/scan`** – QR szkenner felület
* **`/game/scan/live`** – Kamera alapú élő olvasó
* **`/game/gem/:id`** – Egy megtalált kincs (Gem) részletei
* **`/game/treasure-chest`** (vagy **`/my-gems`**) – A játékos által eddig összegyűjtött kincsek
* **`/game/rules`** – Játékszabályzat
* **`/game/legal`** – Jogi nyilatkozat

### 📱 6. KőszegPass és Profilok
* **`/pass`** – KőszegPass főoldal
* **`/pass/register`** – Regisztráció a kártyához
* **`/pass/profile`** – Felhasználói profil szerkesztése
* **`/city-pass`** – Városkártya infók
* **`/scanner`** – Általános kódolvasó partneri elfogadóhelyeknek

### 👔 7. B2B, Admin és Helyi Szolgáltatók
* **`/admin`** – Általános admin dashboard *(Supabase auth, regisztrált emailcímmel/jelszóval)*
* **`/superadmin`** – Rendszergazdai felület
  * 🔐 **BEÉGETETT (Hardcoded) Lépés:**
  * **Felhasználónév:** `TheCinemaker`
  * **Jelszó:** `Nyanyuska_0169`
* **`/auth`** – Bejelentkezés adminoknak és partnereknek
* **`/business`** – Üzleti műszerfal
* **`/koszegieknek`** – Kőszegi lakosok dedikált felülete
* **`/idopontfoglalas`** – Időpontfoglaló szolgáltatóknak
* **`/provider-setup`** – Új szolgáltató regisztrációja
* **`/secret-setup`** – Rejtett regisztrációs felület

### 🖥️ 8. Kioszk Rendszer (Városi Terminálok)
* **`/kiosk/*`** – Egy teljesen elzárt al-ökoszisztéma a városban kihelyezett fizikai érintőképernyős terminálokhoz.

### ⚖️ 9. Jogi
* **`/adatvedelem`** – Adatvédelmi tájékoztató
* **`/partners`** – Partnereink
* **`/terms-provider`** – Szolgáltatói felhasználási feltételek
