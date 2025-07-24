/* --- FÁJL: public/service-worker.js (Hibakereső verzió) --- */

let favoriteEvents = [];
let notifiedEventIds = new Set();
// TESZTHEZ ÁLLÍTSUK NAGYOBBRA AZ IDŐABLAKOT, PL. 60 PERCRE, HOGY BIZTOSAN BELEESSEN
const NOTIFICATION_LEAD_TIME_MINUTES = 1; 

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    console.log('[SW <- APP] Kedvencek megérkeztek:', event.data.favorites);
    favoriteEvents = event.data.favorites.map(e => ({ ...e, start: new Date(e.start) }));
  }
});

function checkAndNotify() {
  const now = new Date();
  console.log(`[SW] Időzítő fut... (${now.toLocaleTimeString()}). Kedvencek: ${favoriteEvents.length}`);

  favoriteEvents.forEach(event => {
    // Ellenőrizzük, hogy az 'event.start' érvényes dátum-e
    if (!(event.start instanceof Date) || isNaN(event.start)) {
        console.log(`[SW] HIBA: "${event.nev}" eseménynek érvénytelen a kezdési dátuma.`);
        return;
    }

    if (event.start < now) {
        console.log(`[SW] KIHAGYVA: "${event.nev}" már elkezdődött.`);
        return;
    }

    if (notifiedEventIds.has(event.id)) {
        console.log(`[SW] KIHAGYVA: "${event.nev}" eseményről már küldtünk értesítést.`);
        return;
    }

    const diffInMinutes = Math.round((event.start.getTime() - now.getTime()) / 1000 / 60);
    
    console.log(`[SW] ELLENŐRZÉS: "${event.nev}". Kezdés ${diffInMinutes} perc múlva. (Feltétel: <= ${NOTIFICATION_LEAD_TIME_MINUTES} perc)`);

    if (diffInMinutes >= 0 && diffInMinutes <= NOTIFICATION_LEAD_TIME_MINUTES) {
      console.log(`[SW] ÉRTESÍTÉS KÜLDÉSE: "${event.nev}"`);
      self.registration.showNotification('Hamarosan kezdődik a kedvenced!', {
        body: `"${event.nev}" ${diffInMinutes} percen belül kezdődik itt: ${event.helyszin.nev}`,
        icon: '/android-chrome-192x192.png',
      });
      notifiedEventIds.add(event.id);
    }
  });
}

setInterval(checkAndNotify, 60 * 1000); // Percenkénti ellenőrzés

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
