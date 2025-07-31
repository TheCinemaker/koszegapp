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
