// src/pages/Kiosk/KioskServices.jsx
import React, { useState, useMemo } from 'react';
import { 
  IoLocationOutline, IoWalkOutline, IoCallOutline, IoTimeOutline, 
  IoCashOutline, IoCall, IoClose, IoAlertCircleOutline
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { getDistance, formatDistance } from './KioskAttractions';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

export default function KioskServices() {
  const { t } = useKioskLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [callingItem, setCallingItem] = useState(null);

  // Category items definitions
  const categories = [
    { id: 'all', label: t('services.categories.all'), icon: '📁' },
    { id: 'wc', label: t('services.categories.wc'), icon: '🚻' },
    { id: 'atm', label: t('services.categories.atm'), icon: '🏧' },
    { id: 'taxi', label: t('services.categories.taxi'), icon: '🚖' },
    { id: 'health', label: t('services.categories.health'), icon: '⚕️' }
  ];

  // Static services database for Kőszeg
  const servicesList = useMemo(() => {
    const rawItems = [
      {
        id: 'wc-var',
        category: 'wc',
        title: t('services.wc.var'),
        desc: t('services.wc.varDesc'),
        lat: 47.390022,
        lng: 16.539825,
        price: t('services.wc.price'),
        hours: t('services.wc.hours'),
        address: 'Rajnis utca 9.'
      },
      {
        id: 'wc-cafes',
        category: 'wc',
        title: t('services.wc.cafes'),
        desc: t('services.wc.cafesDesc'),
        lat: 47.388451231945666,
        lng: 16.542002964713447,
        price: t('services.wc.price'),
        hours: t('services.wc.hours'),
        address: 'Fő tér & Jurisics tér'
      },
      {
        id: 'atm-kh',
        category: 'atm',
        title: t('services.atm.kh'),
        desc: t('services.atm.khDesc'),
        lat: 47.388753,
        lng: 16.541908,
        address: 'Fő tér 4.',
        network: 'VISA / MasterCard'
      },
      {
        id: 'atm-otp',
        category: 'atm',
        title: t('services.atm.otp'),
        desc: t('services.atm.otpDesc'),
        lat: 47.388145,
        lng: 16.540915,
        address: 'Kossuth Lajos u. 8.',
        network: 'VISA / MasterCard / Maestro'
      },
      {
        id: 'atm-mbh',
        category: 'atm',
        title: t('services.atm.mbh'),
        desc: t('services.atm.mbhDesc'),
        lat: 47.389254,
        lng: 16.541703,
        address: 'Várkör utca 6.',
        network: 'VISA / MasterCard / Maestro'
      },
      {
        id: 'taxi-koszeg',
        category: 'taxi',
        title: t('services.taxi.koszeg'),
        desc: t('services.taxi.koszegDesc'),
        lat: 47.388850,
        lng: 16.541250,
        phone: '+36 30 937 7336',
        address: 'Várkör utca 61.'
      },
      {
        id: 'health-szentbenedek',
        category: 'health',
        title: t('services.health.szentbenedek'),
        desc: t('services.health.szentbenedekDesc'),
        lat: 47.388162,
        lng: 16.540821,
        hours: t('services.health.hours'),
        address: 'Kossuth Lajos u. 9.'
      },
      {
        id: 'health-doctor',
        category: 'health',
        title: t('services.health.doctor'),
        desc: t('services.health.doctorDesc'),
        lat: 47.386121,
        lng: 16.538782,
        hours: t('services.health.doctorHours'),
        address: 'Rákóczi Ferenc u. 19.',
        phone: '1830',
        emergency: true
      }
    ];

    // Compute distance and sort by proximity
    const withDistance = rawItems.map(item => {
      const dist = getDistance(KIOSK_LAT, KIOSK_LNG, item.lat, item.lng);
      // Assume average tourist walk speed of 80m per minute
      const walkMin = Math.max(1, Math.round(dist / 80));
      return { ...item, _distance: dist, _walkMinutes: walkMin };
    });

    return withDistance.sort((a, b) => a._distance - b._distance);
  }, [t]);

  // Filter items based on active category tab
  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return servicesList;
    return servicesList.filter(item => item.category === activeCategory);
  }, [activeCategory, servicesList]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none">
        
        {/* Title Section */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            🚏 {t('services.subtitle')}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            {t('services.title')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            {t('services.desc')}
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex p-1.5 gap-1.5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-x-auto shrink-0 shadow-sm scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex-1 min-w-[90px] py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-95
                ${activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}
              `}
            >
              <span className="text-base">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of Services */}
        <div className="flex flex-col gap-4">
          {filteredServices.map((item) => (
            <div
              key={item.id}
              className="
                relative rounded-3xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-5
                bg-white/80 dark:bg-zinc-900/60
                backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-lg
              "
            >
              {/* Proximity / Walk badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-100 dark:border-indigo-900/30">
                <IoWalkOutline className="text-xs shrink-0" />
                <span>
                  {formatDistance(item._distance, t('common.rightHere'))} • {item._walkMinutes} {t('services.walkTime')}
                </span>
              </div>

              {/* Left Side: Information */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl shrink-0">
                    {item.category === 'wc' && '🚻'}
                    {item.category === 'atm' && '🏧'}
                    {item.category === 'taxi' && '🚖'}
                    {item.category === 'health' && (item.emergency ? '🚨' : '⚕️')}
                  </span>
                  <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white leading-tight pr-28">
                    {item.title}
                  </h3>
                </div>

                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed max-w-xl">
                  {item.desc}
                </p>

                {/* Additional custom badges depending on type */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Address Badge */}
                  <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-lg">
                    <IoLocationOutline />
                    {item.address}
                  </span>

                  {/* WC Price & Hours */}
                  {item.category === 'wc' && (
                    <>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        {item.price}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        {item.hours}
                      </span>
                    </>
                  )}

                  {/* ATM Networks */}
                  {item.category === 'atm' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                      <IoCashOutline />
                      {item.network}
                    </span>
                  )}

                  {/* Health Hours */}
                  {item.category === 'health' && item.hours && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                      <IoTimeOutline />
                      {item.hours}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Phone Action for Taxi / Emergency Doctor */}
              {item.phone && (
                <div className="shrink-0 flex items-center justify-end">
                  <button
                    onClick={() => setCallingItem(item)}
                    className="
                      flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-white shadow-md active:scale-95 transition-all
                      bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600
                    "
                  >
                    <IoCall className="text-base" />
                    {t('services.callButton')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Calling Simulation Modal Overlay */}
      {callingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm rounded-[2.5rem] p-8 text-center flex flex-col items-center gap-6 bg-zinc-900 border border-white/10 text-white shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setCallingItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <IoClose className="text-xl" />
            </button>

            {/* Animation / Breathing Ring */}
            <div className="relative w-20 h-20 mt-4 flex items-center justify-center rounded-full bg-indigo-600/25 border border-indigo-500/30">
              <div className="absolute inset-0 bg-indigo-600 rounded-full blur-xl animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <IoCall className="text-2xl text-white animate-bounce" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {t('services.callingText')}
              </span>
              <h3 className="text-xl font-black leading-tight">
                {callingItem.title}
              </h3>
            </div>

            <div className="w-full py-4 px-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Telefonszám / Phone</span>
              <span className="text-2xl font-black font-mono tracking-tight text-indigo-400">
                {callingItem.phone}
              </span>
            </div>

            <div className="p-3.5 bg-indigo-500/5 text-indigo-400 text-xs rounded-2xl flex gap-2 border border-indigo-500/10 text-left font-medium leading-relaxed">
              <IoAlertCircleOutline className="text-xl shrink-0 mt-0.5" />
              <span>
                {t('services.callingSim')}
              </span>
            </div>

            <button
              onClick={() => setCallingItem(null)}
              className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-98 transition-all text-xs font-black uppercase tracking-wider border border-white/5"
            >
              {t('services.closeButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
