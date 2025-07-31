import { parse, getDay, isWithinInterval, isSameDay } from 'date-fns';

export function isParkingPaidNow(hoursString) {
  if (!hoursString || typeof hoursString !== 'string' || !hoursString.includes(' ')) {
    return null;
  }

  try {
    const now = new Date();
    // Magyar napok: Vasárnap = 0, Hétfő = 1, ..., Szombat = 6
    const currentDayOfWeek = getDay(now);

    const parts = hoursString.split(' ');
    const dayRange = parts[0];
    const timeRange = parts[1];

    const dayMap = { 'H': 1, 'K': 2, 'Sze': 3, 'Cs': 4, 'P': 5, 'Szo': 6, 'V': 0 };
    const [startDayChar, endDayChar] = dayRange.split('-');
    const startDay = dayMap[startDayChar];
    const endDay = dayMap[endDayChar];

    // 1. lépés: A mai nap a fizetős napok között van?
    if (currentDayOfWeek < startDay || currentDayOfWeek > endDay) {
      return false; // Ha a mai nap a tartományon kívül van, biztosan ingyenes.
    }

    // 2. lépés: Az időpont a fizetős sávban van?
    const [startTimeStr, endTimeStr] = timeRange.split('-');
    
    // Létrehozzuk a mai napra vonatkozó start és end dátum objektumokat
    const startOfPaidInterval = parse(startTimeStr, 'HH:mm', now);
    const endOfPaidInterval = parse(endTimeStr, 'HH:mm', now);

    // Biztosítjuk, hogy a dátum a mai nap legyen (ez a parse miatt nem mindig egyértelmű)
    if (!isSameDay(now, startOfPaidInterval)) return null; // Valami hiba történt

    return isWithinInterval(now, { start: startOfPaidInterval, end: endOfPaidInterval });
    
  } catch (error) {
    console.error("Hiba a parkolási idő feldolgozása közben:", error);
    return null;
  }
}
