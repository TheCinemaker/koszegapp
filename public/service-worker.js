/* --- FÁJL: public/service-worker.js (10 ID-s Vész-push listával) --- */

// --- BEÁLLÍTÁSOK ---
const NOTIFICATION_LEAD_TIME_MINUTES = 15;
const EMERGENCY_PUSH_URL = '/emergency-push.json';
const CHECK_INTERVAL_MS = 60 * 1000;

// --- BELSŐ VÁLTOZÓK ---
let favoriteEvents = [];
let notifiedEventIds = new Set();
let notifiedEmergencyIds = new Set(); // Mostantól több ID-t is meg tudunk jegyezni

// --- ESEMÉNYFIGYELŐK ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    favoriteEvents = event.data.favorites.map(e => ({ ...e, start: new Date(e.start) }));
  }
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// --- A FŐ LOGIKA ---

// Személyes értesítések ellenőrzése (változatlan)
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

// Vész-push ellenőrzése (a listát feldolgozó logikával)
async function checkEmergencyPush() {
    try {
        const response = await fetch(`${EMERGENCY_PUSH_URL}?t=${new Date().getTime()}`);
        if (!response.ok) return;

        const emergencyMessages = await response.json();
        
        // Végigmegyünk a listán
        if (Array.isArray(emergencyMessages)) {
            emergencyMessages.forEach(msg => {
                // Csak akkor küldünk, ha:
                // 1. Az üzenet aktív (`active: true`)
                // 2. Van ID-ja
                // 3. Ezt az ID-t MÉG NEM küldtük ki korábban
                if (msg && msg.active === true && msg.id && !notifiedEmergencyIds.has(msg.id)) {
                    self.registration.showNotification(msg.title || 'Fontos közlemény', {
                        body: msg.message,
                        icon: '/android-chrome-192x192.png',
                    });
                    // Megjegyezzük, hogy ezt az ID-t már elküldtük
                    notifiedEmergencyIds.add(msg.id);
                }
            });
        }
    } catch (error) {
        // Hiba esetén csendben maradunk
    }
}

// A fő ciklus, ami mindkét ellenőrzést lefuttatja
function runChecks() {
    checkFavoriteNotifications();
    checkEmergencyPush();
}

setInterval(runChecks, CHECK_INTERVAL_MS);
