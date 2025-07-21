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
    if (parts) return new Date(parts[1], parts[2], parts[3]);
  }
  if (typeof str === 'string' && str.includes('.')) {
    const [y, m, d] = str.replace(/\.+$/, '').split('.');
    return new Date(y, m - 1, d);
  }
  return null;
};

const isMenuValidToday = (menu) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = parseDate(menu.validFrom);
  const end = parseDate(menu.validTo);
  return start && end && today >= start && today <= end;
};

const getTodayMenus = (menus, selected) => {
  const dayMap = ['mon','tue','wed','thu','fri','sat'];
  const day = dayMap[(new Date().getDay() + 6) % 7];
  return menus.filter(isMenuValidToday).filter(m => !selected || m.etterem === selected).map(m => {
    const todayMenus = [m[`menu_${day}_a`], m[`menu_${day}_b`], m[`menu_${day}_c`]].filter(Boolean);
    return todayMenus.length ? {...m, todayMenus} : null;
  }).filter(Boolean);
};

export default function StyledWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState('');
  const touchX = useRef(null);

  useEffect(() => {
    fetchMenus(sheetId, sheetName).then(r => setMenus(r.map(transformEntry))).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const restaurantList = [...new Set(menus.map(m => m.etterem))].filter(Boolean).sort();
  const todayMenus = getTodayMenus(menus, selected);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <div
        onTouchStart={e => touchX.current = e.touches[0].clientX}
        onTouchMove={e => {
          const diff = e.touches[0].clientX - touchX.current;
          if (!open && diff > 50) setOpen(true);
          if (open && diff < -50) setOpen(false);
          touchX.current = null;
        }}
        onTouchEnd={() => touchX.current = null}
        className={`fixed top-[50px] left-0 z-50 transform transition-transform duration-700 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="w-72 h-[75vh] bg-blue-100 text-blue-900 border-r-4 border-blue-500 rounded-r-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="sticky top-0 px-4 py-3 flex justify-between items-center border-b bg-blue-200 border-blue-400 z-10">
            <h3 className="text-lg font-extrabold">{todayStr}</h3>
            <button onClick={() => setOpen(false)} className="text-2xl font-bold hover:scale-125 transition">✖</button>
          </div>
          <div className="text-center font-bold px-4 pt-1 pb-2">Éttermek napi menüi</div>
          <div className="px-4 pb-3">
            <select className="w-full border p-2 rounded text-sm" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Összes étterem</option>
              {restaurantList.map((r, i) => <option key={i} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="px-4 pb-4 overflow-y-auto h-full space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : todayMenus.length ? todayMenus.map((m, i) => (
              <div key={i} className="bg-white p-3 rounded-xl shadow hover:shadow-lg transition">
                <div className="text-sm font-semibold text-blue-800">{m.etterem}</div>
                <div className="text-xs text-blue-700 italic">
                  {m.kapcsolat && <div>Kapcsolat: {m.kapcsolat}</div>}
                  {m.hazhozszallitas && <div>Házhozszállítás: {m.hazhozszallitas}</div>}
                  {(m.price_a || m.price_b || m.price_c || m.price_allando) && (
                    <div>Árak: {m.price_a && ` A: ${m.price_a} Ft`} {m.price_b && ` B: ${m.price_b} Ft`} {m.price_c && ` C: ${m.price_c} Ft`} {m.price_allando && ` Állandó: ${m.price_allando} Ft`}</div>
                  )}
                </div>
                <MenuCard data={m} showTodayOnly={!selected} />
              </div>
            )) : (
              <div className="text-center text-blue-500 py-4">Nincs elérhető napi menü.</div>
            )}
          </div>
          <div className="sticky bottom-0 text-center py-2 text-xs font-bold border-t bg-blue-200 border-blue-400">© KőszegAPP – {new Date().getFullYear()}</div>
        </div>
        <div
          onClick={() => setOpen(o => !o)}
          className={`absolute top-[25%] px-3 py-1.5 -right-4 w-36 h-10 flex items-center justify-center
            border rounded-bl-2xl rounded-br-2xl shadow transform rotate-90 origin-right
            cursor-pointer transition bg-blue-400 text-white border-blue-600 hover:bg-blue-500`}
        >
          <span className="text-xs font-bold">NAPI MENÜK</span>
        </div>
      </div>
    </>
  );
}
