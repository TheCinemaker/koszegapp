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
  if (!str) return null;
  if (typeof str === 'string' && str.startsWith('Date(')) {
    const parts = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (parts) {
      const [_, y, m, d] = parts.map((n, i) => i > 0 ? parseInt(n, 10) : null);
      return new Date(y, m, d);
    }
  }
  if (typeof str === 'string' && str.includes('.')) {
    const cleaned = str.trim().replace(/\.+$/, '');
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(cleaned)) {
      const [year, month, day] = cleaned.split('.').map(s => parseInt(s, 10));
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

const isMenuValidToday = (menu) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = parseDate(menu.validFrom);
  const end   = parseDate(menu.validTo);
  if (!start || !end) return false;
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  return today >= start && today <= end;
};

const getTodayMenus = (menus, selectedRestaurant) => {
  const days = ['mon','tue','wed','thu','fri','sat'];
  const idx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const today = days[idx];
  const valid = menus.filter(isMenuValidToday);
  if (selectedRestaurant) {
    return valid.filter(m => m.etterem === selectedRestaurant);
  }
  return valid.map(m => {
    const todayMenus = [m[`menu_${today}_a`], m[`menu_${today}_b`], m[`menu_${today}_c`]]
      .filter(x => x && x.trim());
    return {...m, todayMenus};
  }).filter(m => m.todayMenus.length);
};

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const touchStartX = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchMenus(sheetId, sheetName)
      .then(data => {
        if (!mounted) return;
        setMenus(data.map(transformEntry));
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setError('Hiba a menük betöltésekor.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = e => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open  && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  const restaurants = Array.from(new Set(menus.map(m => m.etterem))).sort();
  const todayMenus   = getTodayMenus(menus, selectedRestaurant);
  const todayDate    = new Date().toLocaleDateString('hu-HU',{
    weekday:'long',year:'numeric',month:'long',day:'numeric'
  });

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => (touchStartX.current = null)}
          className={`relative h-[85%] mt-6 w-2/3 max-w-sm bg-blue-100 shadow-lg transform transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          } border-r-4 border-blue-400 rounded-r-xl overflow-hidden pointer-events-auto`}
        >
          {/* Fejléc */}
          <div className="flex justify-between items-center border-b p-4 bg-blue-200">
            <h2 className="text-sm font-bold text-blue-800">{todayDate}</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-800 hover:text-blue-900"
            >
              ✕
            </button>
          </div>
          {/* Cím */}
          <div className="text-center text-lg font-bold text-blue-900 px-4 pb-2">
            Éttermek napi menüi
          </div>
          {/* Választó */}
          <div className="px-4 pb-3">
            <select
              className="w-full border p-2 rounded"
              value={selectedRestaurant}
              onChange={e => setSelectedRestaurant(e.target.value)}
            >
              <option value="">Összes étterem</option>
              {restaurants.map((r,i)=><option key={i}>{r}</option>)}
            </select>
          </div>
          {/* Lista */}
          <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-180px)] space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full"/>
              </div>
            ) : error ? (
              <div className="text-center p-4 text-red-500">{error}</div>
            ) : todayMenus.length ? (
              todayMenus.map((m,i)=>(
                <div key={i} className="bg-white p-3 rounded shadow">
                  <div className="text-sm font-semibold text-blue-700">
                    {m.etterem}
                    <div className="text-xs italic text-blue-700">
                      {m.kapcsolat && <div>Kapc.: {m.kapcsolat}</div>}
                      {m.hazhozszallitas && <div>Szállít.: {m.hazhozszallitas}</div>}
                      <div>
                        {m.price_a && `A: ${m.price_a} Ft `}
                        {m.price_b && `B: ${m.price_b} Ft `}
                        {m.price_c && `C: ${m.price_c} Ft `}
                      </div>
                    </div>
                  </div>
                  <MenuCard data={m} showTodayOnly={!selectedRestaurant}/>
                </div>
              ))
            ) : (
              <div className="text-center text-blue-500 py-8">
                Nincs elérhető napi menü.
              </div>
            )}
          </div>
          {/* Lábléc */}
          <div className="text-xs text-center text-blue-800 py-2 border-t bg-blue-200">
            © KőszegAPP – {new Date().getFullYear()}
          </div>
          {/* Fogantyú */}
          {!open && (
            <div
              className="absolute top-1/2 -right-8 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <div className="w-8 h-24 flex items-center justify-center bg-blue-400 text-white border border-blue-600 rounded-l-lg shadow">
                <span className="text-xs font-bold rotate-90">NAPI MENÜK</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
