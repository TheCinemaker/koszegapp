import { parse, getDay, isWithinInterval } from 'date-fns';

/**
 * Ellenőrzi, hogy egy adott időpont-string alapján
 * a parkolás az aktuális időben fizetős-e.
 * @param {string} hoursString - pl. "H-P 08:00-17:00"
 * @returns {boolean|null} - true (fizetős), false (ingyenes), vagy null (ismeretlen formátum)
 */
export function isParkingPaidNow(hoursString) {
  if (!hoursString || typeof hoursString !== 'string' || !hoursString.includes(' ')) {
    return null;
  }

  const now = new Date();
  const currentDay = getDay(now); // Vasárnap = 0, Hétfő = 1, ...

  try {
    const parts = hoursString.split(' ');
    const dayRange = parts[0];
    const timeRange = parts[1];

    // --- Napok ellenőrzése ---
    const dayMap = { 'H': 1, 'K': 2, 'Sze': 3, 'Cs': 4, 'P': 5, 'Szo': 6, 'V': 0 };
    let isTodayPaidDay = false;

    if (dayRange.includes('-')) {
      const [startDayChar, endDayChar] = dayRange.split('-');
      const startDay = dayMap[startDayChar];
      const endDay = dayMap[endDayChar];
      if (currentDay >= startDay && currentDay <= endDay) {
        isTodayPaidDay = true;
      }
    } else {
      // Ha csak egy nap van megadva (bár a formátumod nem ilyen)
      if (dayMap[dayRange] === currentDay) {
        isTodayPaidDay = true;
      }
    }
    
    // Ha a mai nap nem fizetős, ingyenes
    if (!isTodayPaidDay) return false;

    // --- Időpont ellenőrzése ---
    const [startTimeStr, endTimeStr] = timeRange.split('-');
    const start = parse(startTimeStr, 'HH:mm', new Date());
    const end = parse(endTimeStr, 'HH:mm', new Date());
    
    // Ugyanarra a napra állítjuk őket a helyes intervallum-ellenőrzéshez
    start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    end.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Ellenőrizzük, hogy a 'most' a start és end között van-e
    return isWithinInterval(now, { start, end });

  } catch (error) {
    console.error("Hiba a parkolási idő feldolgozása közben:", error);
    return null; // Ha a formátum hibás
  }
}
