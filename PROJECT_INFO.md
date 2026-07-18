# Projekt Információk - KőszegApp

Ez a fájl tartalmazza a projekt legfontosabb fejlesztési adatait, elérési útjait és konfigurációs kulcsait.

---

## 🏛️ Projekt Adatok

* **Projekt neve**: KőszegApp (Fő Városi Alkalmazás)
* **Helyi elérési út (Workspace)**: `/Users/thecinemaker/.gemini/antigravity/playground/koszegapp`
* **IDE Workspace Link**: [koszegapp megnyitása ebben az IDE-ben](file:///Users/thecinemaker/.gemini/antigravity/playground/koszegapp)
* **Leírás**: Kőszeg városi mobil-barát webalkalmazás (látnivalók, események, környező települések programjai, parkolás, játék, QR menük, időjárás dashboard és Moments/Reels).

---

## ✨ Legutóbbi Fejlesztések
* **Környező települések programjai (Surrounding Events)**:
  * Adatfájl: [surrounding_events.json](file:///Users/thecinemaker/.gemini/antigravity/playground/koszegapp/public/data/surrounding_events.json)
  * Képek: `public/images/events/` mappába mentve
  * Elérés: `/surrounding-events` útvonalon, a főoldali bento grid kártyáról vagy a globális keresőből
  * Admin felület: Külön kezelő fül a programok rögzítéséhez, szerkesztéséhez és törléséhez település kiválasztásával

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

## 🔄 Kapcsolódó Munkaterületek (IDE)

* [VoltDesk megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/villanyszerelo_munkalap/solar-workflow)
* [Saját Oldal (Portfolio) megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/thecinemaker-portfolio)
* [Weather PWA megnyitása](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/koszeg-weather-pwa)
