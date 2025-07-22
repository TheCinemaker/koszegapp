
let favoriteEvents = [];
let notifiedEventIds = new Set();
const NOTIFICATION_LEAD_TIME_MINUTES = 10; // Hány perccel előtte szóljon

// Figyeljük, ha a fő app üzenetet küld nekünk (azaz frissült a kedvencek listája)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    // Frissítjük a belső listánkat, de az időpontokat Date objektummá alakítjuk
    favoriteEvents = event.data.favorites.map(e => ({
      ...e,
      start: new Date(e.start) 
    }));
  }
});

// A fő ellenőrző ciklus
function checkAndNotify() {
  const now = new Date();

  favoriteEvents.forEach(event => {
    // Ha az esemény már elkezdődött, vagy már értesítettünk róla, nem csinálunk semmit
    if (event.start < now || notifiedEventIds.has(event.id)) {
      return;
    }

    const diffInMinutes = (event.start.getTime() - now.getTime()) / 1000 / 60;

    if (diffInMinutes > 0 && diffInMinutes <= NOTIFICATION_LEAD_TIME_MINUTES) {
     
      self.registration.showNotification('Hamarosan kezdődik a kedvenced!', {
        body: `"${event.nev}" ${NOTIFICATION_LEAD_TIME_MINUTES} percen belül kezdődik a következő helyszínen: ${event.helyszin.nev}`,
        icon: '/icon.png',
        badge: '/badge.png' 
      });

      // Hozzáadjuk az azonosítót a már értesítettek listájához, hogy ne spameljük a felhasználót
      notifiedEventIds.add(event.id);
    }
  });
}

// Indítsuk el az ellenőrzést percenként
setInterval(checkAndNotify, 60 * 1000); 

// Ez a sor biztosítja, hogy a service worker azonnal aktiválódjon
self.addEventListener('install', () => {
  self.skipWaiting();
});
