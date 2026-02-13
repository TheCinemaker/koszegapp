import { parse, getDay, isWithinInterval, setHours, setMinutes, setSeconds, isSameDay } from 'date-fns';

export function isParkingPaidNow(hoursString) {
  if (!hoursString || typeof hoursString !== 'string') {
    return null;
  }

  try {
    const now = new Date();
    const currentDay = getDay(now); // Vasárnap = 0, Hétfő = 1, ...

    // Első lépés: levágjuk a felesleges részeket (pl. ", hétvégén ingyenes")
    const mainPart = hoursString.split(',')[0].trim();

    const parts = mainPart.split(' ');
    if (parts.length < 2) return null;

    const dayRange = parts[0];
    const timeRange = parts[1];

    // --- Napok ellenőrzése ---
    const dayMap = { 'H': 1, 'K': 2, 'Sze': 3, 'Cs': 4, 'P': 5, 'Szo': 6, 'V': 0 };
    const [startDayChar, endDayChar] = dayRange.split('-');
    const startDay = dayMap[startDayChar];
    const endDay = dayMap[endDayChar];

    if (currentDay < startDay || currentDay > endDay) {
      return false;
    }

    // --- Időpont ellenőrzése ---
    const [startHourStr, endHourStr] = timeRange.split('-');
    const startHour = parseInt(startHourStr, 10);
    const endHour = parseInt(endHourStr, 10);

    let startOfPaidInterval = setSeconds(setMinutes(setHours(now, startHour), 0), 0);
    let endOfPaidInterval = setSeconds(setMinutes(setHours(now, endHour), 0), 0);

    // Ellenőrizzük, hogy az 'most' a start és end között van-e
    return isWithinInterval(now, { start: startOfPaidInterval, end: endOfPaidInterval });

  } catch (error) {
    console.error("Hiba a parkolási idő feldolgozása közben:", error);
    return null;
  }
}

// --- GPS / Geometria Segédfüggvények ---

function toRad(value) {
  return (value * Math.PI) / 180;
}

// Távolság két pont között (Haversine formula) - méterben
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Föld sugara méterben
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Távolság pont és szakasz között (méterben)
function distToSegment(p, v, w) {
  const l2 = getDistance(v[0], v[1], w[0], w[1]) ** 2;
  // Ha a szakasz hossza 0 (pont), akkor távolság a ponttól
  if (l2 === 0) return getDistance(p[0], p[1], v[0], v[1]);

  // Paraméter t kiszámítása a vetülethez. De egyszerűsítésként földrajzi koordinátáknál
  // kis távolságokon közelíthetünk síkgeometriával a vetítéshez, majd a távolságot Haversine-nal mérjük.
  // Pontosabb megoldás: Cross-track distance, de rövid szakaszoknál (utcák) a síkbecslés is elég a vetítés helyének megtalálásához.

  // Egyszerűbb megközelítés: Távolság a kezdőponttól, végponttól, és a szakaszra vetített ponttól.
  // Mivel geodéziai távolság bonyolult, itt egy egyszerűsített "brute-force"-szerű
  // megoldást használunk kis szegmensekre: ellenőrizzük a két végpontot.
  // PONTOSÍTÁS: Mivel az utcák görbülnek és a pontok sűrűn vannak (polyline),
  // elég lehet a polyline pontjaitól való távolságot mérni. Ha elég sűrű a polyline (márpedig az OpenStreetMap export az szokott lenni),
  // akkor a csúcspontoktól való minimális távolság jó közelítés.

  // Ha mégis szakasz távolság kell:
  // Inkább maradjunk a csúcspontoknál (vertexeknél), mert a 'lines' tömb sűrű pontsorozat.
  // Ez sokkal gyorsabb és egyszerűbb.
  return Math.min(
    getDistance(p[0], p[1], v[0], v[1]),
    getDistance(p[0], p[1], w[0], w[1])
  );
}

// Távolság pont és polyline (pontsorozat) között
// Visszaadja a legkisebb távolságot méterben
export function getDistanceFromPolyline(userLat, userLng, polylinePoints) {
  let minDistance = Infinity;

  // Végigmegyünk minden szakaszon (két szomszédos pont)
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const p1 = polylinePoints[i];
    const p2 = polylinePoints[i + 1];

    // Távolság a szakasz végpontjaitól (egyszerűsítés) - de szakasz közepét is nézhetnénk.
    // A legbiztosabb és legegyszerűbb itt: minden ponttól a távolság.
    // A polyline definícióban [lat, lng] tömbök vannak.

    // Tegyük még pontosabbá: nézzük meg a szakasz felezőpontját is.
    const midLat = (p1[0] + p2[0]) / 2;
    const midLng = (p1[1] + p2[1]) / 2;

    const d1 = getDistance(userLat, userLng, p1[0], p1[1]);
    const d2 = getDistance(userLat, userLng, p2[0], p2[1]);
    const dMid = getDistance(userLat, userLng, midLat, midLng);

    minDistance = Math.min(minDistance, d1, d2, dMid);
  }

  return minDistance;
}
