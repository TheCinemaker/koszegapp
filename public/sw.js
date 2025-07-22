/* --- FÁJL: public/service-worker.js --- */

let favoriteEvents = [];
let notifiedEventIds = new Set();
const NOTIFICATION_LEAD_TIME_MINUTES = 15;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    favoriteEvents = event.data.favorites.map(e => ({ ...e, start: new Date(e.start) }));
  }
});

function checkAndNotify() {
  const now = new Date();
  favoriteEvents.forEach(event => {
    if (event.start < now || notifiedEventIds.has(event.id)) {
      return;
    }
    const diffInMinutes = (event.start.getTime() - now.getTime()) / 1000 / 60;
    if (diffInMinutes > 0 && diffInMinutes <= NOTIFICATION_LEAD_TIME_MINUTES) {
      self.registration.showNotification('Hamarosan kezdődik a kedvenced!', {
        body: `"${event.nev}" ${NOTIFICATION_LEAD_TIME_MINUTES} percen belül kezdődik a következő helyszínen: ${event.helyszin.nev}`,
        icon: '/icon-192.png', // Tegyél egy ikont a public mappába
      });
      notifiedEventIds.add(event.id);
    }
  });
}

setInterval(checkAndNotify, 60 * 1000); 

self.addEventListener('install', () => {
  self.skipWaiting();
});
