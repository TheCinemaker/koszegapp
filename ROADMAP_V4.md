# ⚠️ KRITIKUS SZABÁLY: A JEGYVÁSÁRLÁSI RENDSZERHEZ SOHA TÖBBET NEM NYÚLUNK!

# ROADMAP V4 - Ticket System & Billingo Integration

## ✅ Phase 3: Billingo & Multi-Ticket Support (Befejezve - 2026.03.05)

### 1. Adatbázis Architektúra
- **`ticket_orders` tábla**: Új tábla a számlázási adatok (név, cím) és a Billingo azonosítók tárolására.
- **Kapcsolatok**: A `tickets` tábla mostantól az `order_id`-n keresztül kapcsolódik a rendeléshez, így egy vásárlással több jegy is kezelhető.
- **Migráció**: Sikeresen lefutott a `20260305_add_billing_support.sql`.

### 2. Billingo Integráció
- **Automatizálás**: Partner keresése email alapján (duplikáció szűrés) -> Partner létrehozás -> Számla generálás.
- **Adózás**: Beállítva az **AAM (Alanyi Adómentes)** státusz.
- **Robustness**: Felkészítve a Billingo API különböző válaszformátumaira (data.id fallback).
- **Fizetési mód**: Bekötve az `online_bankcard` típus.

### 3. Stripe & Valuta Kezelés
- **HUF Fix**: A forint kezelése cent-alapúra (100x szorzó) módosítva a Stripe felé a minimális összeg (175 Ft) hiba elkerülése érdekében.
- **Konverzió**: A Billingo felé a webhook már az eredeti (osztott) összeget küldi.
- **Webhook**: Biztonságos aláírás-ellenőrzés és metadata feldolgozás.

### 4. Kommunikáció (Email)
- **Összevont Email**: Egy vásárlásról egy email megy, benne az összes jeggyel.
- **PDF Jegyek**: Minden jegy mellé bekerült a "Nyomtatható Jegy / PDF" gomb.
- **Számla**: Az email tartalmazza a Billingo-ból generált PDF számla letöltő linkjét.

---

## 🎨 Következő fázis: Design finomítások
- **Live Background**: Időjárás-érzékeny és napszak-érzékeny háttér finomítása.
- **UI Polishing**: Jegyvásárlási felület esztétikai javítása.
- **Live Mode**: Átállás Stripe és Billingo éles (Production) módra.

---
*Mentve: 2026-03-05 10:50*
