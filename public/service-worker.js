
let favoriteEvents = [];
let notifiedEventIds = new Set();
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

// A service worker életciklus eseményei
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

async function checkEmergencyMessage() {
  try {
    const response = await fetch(`/emergency-push.json?t=${new Date().getTime()}`);
    if (!response.ok) return;

    const data = await response.json();

    if (data && data.isActive && !sentEmergencyMessageIds.has(data.messageId)) {
      self.registration.showNotification(data.title || 'Fontos Közlemény', {
        body: data.message,
        icon: '/images/koeszeg_logo_nobg.png',
        badge: '/images/koeszeg_logo_nobg.png'
      });
      sentEmergencyMessageIds.add(data.messageId);
    }
  } catch (error) {
    // console.log('Silent fail on emergency check to avoid spam');
  }
}

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
        icon: '/images/koeszeg_logo_nobg.png', // A hiányzó ikonjaid helyett a logót használjuk
        badge: '/images/koeszeg_logo_nobg.png'
      });
      notifiedEventIds.add(event.id);
    }
  });
}


function runChecks() {
  checkFavoriteNotifications();
  checkEmergencyMessage();
}

setInterval(runChecks, 60 * 1000);
