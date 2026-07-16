# ⚠️ FONTOS RENDSZERÜZENET / CRITICAL SYSTEM NOTICE

## 🌿 FEJLESZTÉSI ÁG SZABÁLY (2026. július 16.)
**Minden fejlesztést és dizájn módosítást a `koszegapp3` git ágon végzünk és oda pusholunk!** A `main` ághoz közvetlenül nem nyúlunk, kivéve ha a felhasználó kifejezetten kéri a main-en lévő hiba javítását.


## [HU] JEGYVÁSÁRLÁSI ÉS SZÁMLÁZÁSI RENDSZER
**Állapot:** ÉLES / STABIL
**Szabály:** EHHEZ A MODULHOZ SOHA TÖBBET NEM NYÚLUNK HOZZÁ!

Ez a rendszer (Stripe + Billingo + Supabase + Netlify Functions) jelenleg tökéletesen működik. Bármilyen módosítás kockáztatja a bevételt és a jegyértékesítés folyamatát. 

**Érintett fájlok:**
- `netlify/functions/ticket-webhook.js`
- `netlify/functions/ticket-create-checkout.js`
- `netlify/functions/lib/billingoService.js`
- `netlify/functions/lib/ticketConfig.js`
- `netlify/functions/ticket-config.json`

---

## [EN] TICKET PURCHASE & BILLING SYSTEM
**Status:** LIVE / STABLE
**Rule:** DO NOT MODIFY THIS SYSTEM EVER AGAIN!

This system (Stripe + Billingo + Supabase + Netlify Functions) is currently working perfectly. Any modification risks revenue and the ticket sales process.

**Affected files:**
- listed above
