import { parse, getDay, isWithinInterval } from 'date-fns';

// Ez a függvény a "H-P 08:00-17:00" formátumú stringet dolgozza fel
export function isParkingPaidNow(hoursString) {
  if (!hoursString || typeof hoursString !== 'string') return null;

  const now = new Date();
  const currentDay = getDay(now); // Vasárnap = 0, Hétfő = 1, ... Szombat = 6

  const parts = hoursString.split(' ');
  if (parts.length < 2) return null;

  const dayRange = parts[0]; // pl. "H-P"
  const timeRange = parts[1]; // pl. "08:00-17:00"

  // Napok ellenőrzése
  let startDay, endDay;
  if (dayRange.includes('-')) {
    const days = dayRange.split('-');
    const dayMap = { 'H': 1, 'K': 2, 'Sze': 3, 'Cs': 4, 'P': 5, 'Szo': 6, 'V': 0 };
    startDay = dayMap[days[0]];
    endDay = dayMap[days[1]];
    if (currentDay < startDay || currentDay > endDay) {
      return false; // Ma nem fizetős nap van
    }
  }
  
  // Időpontok ellenőrzése
  const [startTimeStr, endTimeStr] = timeRange.split('-');
  const start = parse(startTimeStr, 'HH:mm', new Date());
  const end = parse(endTimeStr, 'HH:mm', new Date());
  
  start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  end.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

  return isWithinInterval(now, { start, end });
}
