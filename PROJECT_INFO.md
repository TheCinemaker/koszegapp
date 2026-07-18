# Projekt Információk - KőszegApp

Ez a fájl tartalmazza a KőszegApp (visitKőszeg.hu) legfontosabb fejlesztési adatait, elérési útjait és konfigurációs kulcsait.

---

## 🏛️ Projekt Adatok

* **Projekt neve**: KőszegApp (Fő Városi Alkalmazás)
* **Helyi elérési út (Workspace)**: `/Users/thecinemaker/.gemini/antigravity/playground/koszegapp`
* **IDE Workspace Link**: [koszegapp megnyitása ebben az IDE-ben](file:///Users/thecinemaker/.gemini/antigravity/playground/koszegapp)
* **Leírás**: Kőszeg városi mobil-barát webalkalmazás (látnivalók, események, környező hegyaljai települések programjai, parkolás, játékok, QR menük, időjárás és KőszegAI chat asszisztens).

---

## ⚡ Aktuális Státusz & Fejlesztések

* **Hegyaljai programok (Surrounding Events)**:
  * Adatfájl: [surrounding_events.json](file:///Users/thecinemaker/.gemini/antigravity/playground/koszegapp/public/data/surrounding_events.json) (2026-os falunapok és rendezvények Bozsok, Cák, Velem, Lukácsháza, Kőszegszerdahely és Kőszegdoroszló településekről).
  * Elérés: `/surrounding-events` útvonalon, a főoldal "HEGYALJAI PROGRAMOK" bento csempéjéről vagy a keresőből.
  * Admin felület: Teljes CRUD támogatás (rögzítés, szerkesztés, törlés, képfeltöltés) a partnerek és adminok számára a `save-github-json` Netlify funkción keresztül.
* **KőszegPass Kioszk (Tablet) Mód**:
  * Céloldal: `/buy-pass` (szállodák recepciós tabletjeihez).
  * Izoláció: Amikor a `kiosk_mode` be van állítva, a globális fejlécek, láblécek és a `SmartSpotlight` elrejtésre kerül a teljes fizetési folyamat alatt (`/pass/register`, `/pass/buy`, `/pass/success`).
  * Különleges funkciók: A sikeres képernyő nagy QR kódot jelenít meg (a kártya letöltéséhez a vendégnek) és egy "Kész / Új Vásárlás" gombot, ami kiüríti a memóriát. A fogaskerék ikon törölve van, a konfigurációs ablak a logó fejlécében a "visit" szóra való 5 másodperces hosszú gombnyomással érhető el.
* **KőszegAI Asszisztens (`/koszegai`)**:
  * Chatbot "Dimitryj" névvel, barátságos tegeződő hangnemmel, helyi turisztikai és esemény-adatbázisra alapozva.
  * Memória: Helyi tárolóban (`localStorage`) emlékszik a visszatérő vendégekre.
  * Kialakítás: A beviteli mező 84px-el megemelve a lebegő menüsáv (`FloatingNavbar`) felett.

---

## 🔗 Külső Szolgáltatások & Címek

* **GitHub Repository**: [GitHub - koszegapp](https://github.com/TheCinemaker/koszegapp.git)
* **Supabase Console**: [Supabase Project ebsxjwqdzraazinacbma](https://supabase.com/dashboard/project/ebsxjwqdzraazinacbma)
* **Netlify Console**: [Netlify Dashboard](https://app.netlify.com/teams/thecinemaker/overview)
* **Éles Szolgáltatások / Weboldalak**:
  * [TheTicket weboldal](https://theticket.hu)
  * [KőszegEats weboldal](https://koszegeats.hu)

---

## 🔑 Környezeti Változók & Beégetett Kulcsok (`.env`)

* **Supabase API**:
  * `VITE_SUPABASE_URL`: `https://ebsxjwqdzraazinacbma.supabase.co`
  * `VITE_SUPABASE_ANON_KEY`: *Anon public key beállítva a `.env`-ben*
* **E-mail szolgáltató**:
  * `RESEND_API_KEY`: *Lásd a helyi .env fájlban*
* **Google Wallet (KőszegPass)**:
  * Service Account: `wallet-pass-generator@koszegappwallet.iam.gserviceaccount.com`
  * Issuer ID: `3388000000023076062`
  * Class ID: `KoszegPass_Standard_v2`
* **Stripe Fizetési Kapu (Test Mode)**:
  * `STRIPE_SECRET_KEY`: *Lásd a helyi .env fájlban*
  * `STRIPE_WEBHOOK_SECRET`: *Lásd a helyi .env fájlban*

---

## ⏭️ Elmaradt feladatok / TODO
* [ ] **Email migráció**: A fejlesztés során használt `koszegapp@gmail.com` címet át kell ütemezni egy hivatalos `@visitkoszeg.hu` domainre a kiküldéseknél.
* [ ] **Szolgáltatói bejelentkezés (Booking redirection)**: Ellenőrizni kell, hogy a bejelentkezetlen felhasználó foglaláskor sikeresen visszairányítódik-e a `BookingModal` felületre a hitelesítés után.

---

## 🔄 Kapcsolódó Munkaterületek (IDE)

* [VoltDesk megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/villanyszerelo_munkalap/solar-workflow)
* [Saját Oldal (Portfolio) megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/thecinemaker-portfolio)
* [Weather PWA megnyitása](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/koszeg-weather-pwa)
