import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

const transformEntry = (raw) => ({
  etterem: raw['Étterm neve'] || raw['Étterem neve'] || raw['Etterem neve'] || '',
  kapcsolat: raw['Elérhetőség (telefon)'] || raw['Elérhetőség'] || '',
  hazhozszallitas: raw['Kiszállítás'] || raw['Házhozszállítás'] || '',
  menu_allando: raw['Állandó menü'] || '',
  menu_mon_a: raw['Hétfő A menü'] || '',
  menu_mon_b: raw['Hétfő B menü'] || '',
  menu_mon_c: raw['Hétfő C menü'] || '',
  menu_tue_a: raw['Kedd A menü'] || '',
  menu_tue_b: raw['Kedd B menü'] || '',
  menu_tue_c: raw['Kedd C menü'] || '',
  menu_wed_a: raw['Szerda A menü'] || '',
  menu_wed_b: raw['Szerda B menü'] || '',
  menu_wed_c: raw['Szerda C menü'] || '',
  menu_thu_a: raw['Csütörtök A menü'] || '',
  menu_thu_b: raw['Csütörtök B menü'] || '',
  menu_thu_c: raw['Csütörtök C menü'] || '',
  menu_fri_a: raw['Péntek A menü'] || '',
  menu_fri_b: raw['Péntek B menü'] || '',
  menu_fri_c: raw['Péntek C menü'] || '',
  menu_sat_a: raw['Szombat A menü'] || '',
  menu_sat_b: raw['Szombat B menü'] || '',
  menu_sat_c: raw['Szombat C menü'] || '',
  price_a: raw['"A" menü ára'] || '',
  price_b: raw['"B" menü ára'] || '',
  price_c: raw['"C" menü ára'] || '',
  price_allando: raw['Állandó menü ára'] || '',
  validFrom: raw['Kezdő dátum'] ? raw['Kezdő dátum'].toString().trim() : '',
  validTo: raw['Utolsó nap dátum'] ? raw['Utolsó nap dátum'].toString().trim() : ''
});

const parseDate = (str) => {
  if (!str || typeof str !== 'string') return null;
  
  // Tisztítás: eltávolítjuk a felesleges pontot a végéről és szóközöket
  const cleaned = str.trim().replace(/\.+$/, '');
  
  // Ellenőrizzük, hogy a formátum megfelelő-e (éééé.hh.nn)
  if (!/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(cleaned)) {
    console.warn('Érvénytelen dátumformátum:', str);
    return null;
  }
  
  // Szétválasztás és számokká konvertálás
  const [yearStr, monthStr, dayStr] = cleaned.split('.');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexelt hónap
  const day = parseInt(dayStr, 10);
  
  // Dátum létrehozása és érvényesség ellenőrzése
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) {
    console.warn('Érvénytelen dátum:', str);
    return null;
  }
  
  return date;
};

const isMenuValidToday = (menu) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = parseDate(menu.validFrom);
    const end = parseDate(menu.validTo);
    
    if (!start || !end) {
      console.warn('Hiányzó vagy érvénytelen dátum:', menu.etterem, menu.validFrom, menu.validTo);
      return false;
    }
    
    // Másolatot készítünk, hogy ne módosítsuk az eredeti dátumokat
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const isValid = today >= startDate && today <= endDate;
    
    if (!isValid) {
      console.log('Nem érvényes menü:', menu.etterem, 
        'Kezdő dátum:', startDate, 
        'Befejező dátum:', endDate, 
        'Ma:', today);
    }
    
    return isValid;
  } catch (e) {
    console.error('Hiba a dátum ellenőrzésében:', e);
    return false;
  }
};

const getTodayMenus = (menus, selectedRestaurant) => {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIndex = new Date().getDay();
  const todayIdx = dayIndex === 0 ? 6 : dayIndex - 1; // vasárnap = 6, hétfő = 0
  const today = days[todayIdx];

  const validMenus = menus.filter(isMenuValidToday);

  if (selectedRestaurant) {
    return validMenus.filter(m => {
      const hasMenu = [
        m[`menu_${today}_a`],
        m[`menu_${today}_b`],
        m[`menu_${today}_c`]
      ].some(menu => menu && menu.trim() !== '');
      
      return m.etterem === selectedRestaurant && hasMenu;
    });
  }

  return validMenus
    .map(m => ({
      ...m,
      todayMenus: [
        m[`menu_${today}_a`],
        m[`menu_${today}_b`],
        m[`menu_${today}_c`]
      ].filter(menu => menu && menu.trim() !== '')
    }))
    .filter(m => m.todayMenus.length > 0);
};

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const touchStartX = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    async function load() {
      try {
        const rawData = await fetchMenus(sheetId, sheetName);
        if (!isMounted) return;
        
        const transformed = rawData.map(transformEntry);
        console.log('Betöltött menük:', transformed.map(m => ({
          etterem: m.etterem,
          validFrom: m.validFrom,
          validTo: m.validTo,
          parsedFrom: parseDate(m.validFrom),
          parsedTo: parseDate(m.validTo)
        })));
        
        setMenus(transformed);
      } catch (err) {
        console.error('Error fetching menus:', err);
        if (isMounted) {
          setError('Hiba a menük betöltésekor. Próbáld újra később.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      closeTimer.current = setTimeout(() => setOpen(false), 12000);
      return () => clearTimeout(closeTimer.current);
    }
  }, [open]);

  const onTouchStart = (e) => { 
    touchStartX.current = e.touches[0].clientX; 
  };
  
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  const restaurants = [...new Set(menus.map(m => m.etterem).filter(Boolean)].sort();
  const todayMenus = getTodayMenus(menus, selectedRestaurant);
  const todayDate = new Date().toLocaleDateString('hu-HU', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-[85%] mt-6 w-2/3 max-w-sm bg-blue-100 shadow-lg transform z-50 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} border-r-4 border-blue-400 rounded-r-xl overflow-hidden`}
      >
        <div className="flex justify-between items-center border-b p-4 bg-blue-200">
          <h2 className="text-sm font-bold text-blue-800">{todayDate}</h2>
          <button 
            onClick={() => setOpen(false)} 
            className="text-blue-800 hover:text-blue-900"
            aria-label="Bezárás"
          >
            ✕
          </button>
        </div>
        <div className="text-center text-lg font-bold text-blue-900 px-4 pb-2">
          Éttermek napi menüi
        </div>

        <div className="px-4 pb-3">
          <select
            className="w-full border p-2 rounded text-sm"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            aria-label="Válassz éttermet"
          >
            <option value="">Összes étterem</option>
            {restaurants.map((r, idx) => (
              <option key={idx} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-180px)] space-y-4">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            </div>
          )}
          
          {error && (
            <div className="text-center p-4 text-red-500">
              {error}
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
              >
                Újrapróbálom
              </button>
            </div>
          )}
          
          {!loading && !error && (
            todayMenus.length ? (
              todayMenus.map((menu, idx) => (
                <div key={`${menu.etterem}-${idx}`} className="bg-white p-3 rounded shadow">
                  <div className="text-sm font-semibold text-blue-700">
                    {menu.etterem}
                    <div className="text-xs text-blue-700 italic">
                      {menu.kapcsolat && <div>Kapcsolat: {menu.kapcsolat}</div>}
                      {menu.hazhozszallitas && <div>Házhozszállítás: {menu.hazhozszallitas}</div>}
                      {(menu.price_a || menu.price_b || menu.price_c || menu.price_allando) && (
                        <div>
                          Árak: 
                          {menu.price_a && ` A: ${menu.price_a} Ft`}
                          {menu.price_b && ` B: ${menu.price_b} Ft`}
                          {menu.price_c && ` C: ${menu.price_c} Ft`}
                          {menu.price_allando && ` Állandó: ${menu.price_allando} Ft`}
                        </div>
                      )}
                    </div>
                  </div>
                  <MenuCard data={menu} showTodayOnly={!selectedRestaurant} />
                </div>
              ))
            ) : (
              <div className="text-center text-blue-500 py-8">
                <p>Nincs elérhető napi menü.</p>
                {menus.length > 0 && (
                  <p className="text-xs mt-2">
                    ({menus.length} étterem van a rendszerben, de nincs ma érvényes menü)
                  </p>
                )}
              </div>
            )
          )}
        </div>
        <div className="text-xs text-center text-blue-800 py-2 border-t bg-blue-200">
          © KőszegAPP – {new Date().getFullYear()}
        </div>
      </div>
      <div
        className="fixed top-1/2 -left-4 w-32 h-10 flex items-center justify-center bg-blue-400 text-white border border-blue-600 rounded-br-2xl rounded-bl-2xl shadow transform -rotate-90 origin-top-left cursor-pointer select-none z-50 hover:bg-blue-500 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Napi menük megnyitása"
      >
        <span className="text-xs font-bold">NAPI MENÜK</span>
      </div>
    </>
  );
}
