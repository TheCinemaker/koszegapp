// --- BEÁLLÍTÁSOK ---
const NOTIFICATION_LEAD_TIME_MINUTES = 15; // Személyes értesítések időablaka
const EMERGENCY_PUSH_URL = '/emergency-push.json'; // A vész-push JSON fájl
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Ellenőrzés gyakorisága: 5 perc

// --- BELSŐ VÁLTOZÓK ---
let favoriteEvents = [];
let notifiedEventIds = new Set();
let notifiedEmergencyIds = new Set();

// --- ESEMÉNYFIGYELŐK ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    favoriteEvents = event.data.favorites.map(e => ({ ...e, start: new Date(e.start) }));
  }
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// --- A FŐ LOGIKA ---

// Személyes, kedvencekre vonatkozó értesítések ellenőrzése
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

// Központi, vész-push értesítések ellenőrzése
async function checkEmergencyPush() {
    try {
        // A cache-elést egyedi időbélyeggel akadályozzuk meg
        const response = await fetch(`${EMERGENCY_PUSH_URL}?t=${new Date().getTime()}`);
        if (!response.ok) return;

        const emergencyMessages = await response.json();
        
        if (Array.isArray(emergencyMessages)) {
            emergencyMessages.forEach(msg => {
                if (msg && msg.active === true && msg.id && !notifiedEmergencyIds.has(msg.id)) {
                    self.registration.showNotification(msg.title || 'Fontos közlemény', {
                        body: msg.message,
                        icon: '/android-chrome-192x192.png',
                    });
                    notifiedEmergencyIds.add(msg.id);
                }
            });
        }
    } catch (error) {
        // Hiba esetén csendben maradunk, hogy a Service Worker ne álljon le.
    }
}

// A fő ciklus, ami mindkét ellenőrzést lefuttatja
function runChecks() {
    checkFavoriteNotifications();
    checkEmergencyPush();
}

// Indítsuk el az ellenőrzést a beállított időközönként
setInterval(runChecks, CHECK_INTERVAL_MS);
