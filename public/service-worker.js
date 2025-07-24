/* --- FÁJL: public/service-worker.js (Vész-push funkcióval) --- */

// --- BEÁLLÍTÁSOK ---
const NOTIFICATION_LEAD_TIME_MINUTES = 15; // Személyes értesítések időablaka (perc)
const EMERGENCY_PUSH_URL = '/emergency-push.json'; // A vész-push JSON fájl elérési útja
const CHECK_INTERVAL_MS = 60 * 1000; // Ellenőrzés gyakorisága (1 perc)


// --- BELSŐ VÁLTOZÓK ---
let favoriteEvents = [];
let notifiedEventIds = new Set();
let notifiedEmergencyId = null; // Itt tároljuk a legutóbbi vész-push ID-ját


// --- ESEMÉNYFIGYELŐK ---

// Figyeljük, ha a fő app üzenetet küld (kedvencek frissítése)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    favoriteEvents = event.data.favorites.map(e => ({ ...e, start: new Date(e.start) }));
  }
});

// Azonnali aktiválás
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());


// --- A FŐ LOGIKA ---

// 1. A személyes, kedvencekre vonatkozó értesítések ellenőrzése
function checkFavoriteNotifications() {
  const now = new Date();
  favoriteEvents.forEach(event => {
    if (!(event.start instanceof Date) || isNaN(event.start) || event.start < now || notifiedEventIds.has(event.id)) {
      return;
    }
    const diffInMinutes = Math.round((event.start.getTime() - now.getTime()) / 1000 / 60);
    if (diffInMinutes >= 0 && diffInMinutes <= NOTIFICATION_LEAD_TIME_MINUTES) {
      self.registration.showNotification('Hamarosan kezdődik a kedvenced!', {
        body: `"${event.nev}" ${diffInMinutes} percen belül kezdődik itt: ${event.helyszin.nev}`,
        icon: '/android-chrome-192x192.png',
      });
      notifiedEventIds.add(event.id);
    }
  });
}

// 2. A központi, vész-push értesítések ellenőrzése
async function checkEmergencyPush() {
    try {
        // A `?t=${new Date().getTime()}` rész megakadályozza, hogy a böngésző gyorsítótárazza a fájlt
        const response = await fetch(`${EMERGENCY_PUSH_URL}?t=${new Date().getTime()}`);
        if (!response.ok) return;

        const emergencyData = await response.json();
        
        // Csak akkor küldünk, ha van új, érvényes üzenet
        if (emergencyData && emergencyData.id && emergencyData.id !== notifiedEmergencyId) {
            self.registration.showNotification(emergencyData.title || 'Fontos közlemény', {
                body: emergencyData.message,
                icon: '/android-chrome-192x192.png',
            });
            // Megjegyezzük, hogy ezt az ID-t már elküldtük
            notifiedEmergencyId = emergencyData.id;
        }
    } catch (error) {
        // Csendben kezeljük a hibát, hogy ne álljon le a Service Worker
        // console.error('[SW] Hiba a vész-push ellenőrzésekor:', error);
    }
}

// A fő ciklus, ami mindkét ellenőrzést lefuttatja
function runChecks() {
    checkFavoriteNotifications();
    checkEmergencyPush();
}

// Indítsuk el az ellenőrzést a beállított időközönként
setInterval(runChecks, CHECK_INTERVAL_MS);
