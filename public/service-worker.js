let favoriteEvents = [];
let notifiedEventIds = new Set();
// <<< ÚJ: A már kiküldött vészüzenetek azonosítóit tároljuk >>>
let sentEmergencyMessageIds = new Set(); 
const NOTIFICATION_LEAD_TIME_MINUTES = 10;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_FAVORITES') {
    favoriteEvents = event.data.favorites.map(e => ({
      ...e,
      start: new Date(e.start) 
    }));
  }
});

// <<< ÚJ: Külön függvény a vészhelyzeti üzenet ellenőrzésére >>>
async function checkEmergencyMessage() {
  try {
    // A cache-bust query string biztosítja, hogy mindig a legfrissebb verziót kérje le
    const response = await fetch(`/api/emergency_message.json?t=${new Date().getTime()}`);
    if (!response.ok) return;

    const data = await response.json();

    // Csak akkor küldünk, ha aktív ÉS ezt az üzenetet még NEM küldtük ki
    if (data && data.isActive && !sentEmergencyMessageIds.has(data.messageId)) {
      
      self.registration.showNotification(data.title || 'Fontos Közlemény', {
        body: data.message,
        icon: '/icon.png',
        badge: '/badge.png'
      });

      // Hozzáadjuk az azonosítót a már kiküldöttek listájához
      sentEmergencyMessageIds.add(data.messageId);
    }
  } catch (error) {
    // Csendben elnyeljük a hibát, hogy a fő ciklus ne álljon le
    console.error('Hiba a vészhelyzeti üzenet ellenőrzésekor:', error);
  }
}

// A te meglévő, tökéletes függvényed a kedvencek ellenőrzésére
function checkFavoriteNotifications() {
  const now = new Date();
  favoriteEvents.forEach(event => {
    if (event.start < now || notifiedEventIds.has(event.id)) {
      return;
    }
    const diffInMinutes = (event.start.getTime() - now.getTime()) / 1000 / 60;
    if (diffInMinutes > 0 && diffInMinutes <= NOTIFICATION_LEAD_TIME_MINUTES) {
      self.registration.showNotification('Hamarosan kezdődik a kedvenced!', {
        body: `"${event.nev}" ${NOTIFICATION_LEAD_TIME_MINUTES} percen belül kezdődik itt: ${event.helyszin.nev}`,
        icon: '/icon.png',
        badge: '/badge.png' 
      });
      notifiedEventIds.add(event.id);
    }
  });
}

// <<< MÓDOSÍTÁS: A fő ciklus most már mindkét feladatot elvégzi >>>
function runChecks() {
  checkFavoriteNotifications();
  checkEmergencyMessage();
}

// Indítsuk el az ellenőrzést percenként
setInterval(runChecks, 60 * 1000); 

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Fontos: Biztosítja, hogy az aktiválás után a service worker átvegye az irányítást
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
