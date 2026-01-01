import React, { useState, useEffect, useMemo } from 'react';
import { fetchInfo } from '../api';
import { Link } from 'react-router-dom';
import {
  IoMedkit,
  IoFlame,
  IoPaw,
  IoInformationCircle,
  IoCall,
  IoPhonePortrait,
  IoShieldCheckmark,
  IoLeaf,
  IoArrowBack,
  IoChevronForward,
  IoWifi,
  IoCloudOffline,
  IoFlash
} from 'react-icons/io5';
import { FadeUp } from '../components/AppleMotion';

// Ikon-leképezés (Filled IO5 verziók a premium hatáshoz)
const iconMap = {
  'FaAmbulance': IoMedkit,
  'FaFirstAid': IoMedkit,
  'FaFireExtinguisher': IoFlame,
  'FaPills': IoMedkit,
  'FaPaw': IoPaw,
  'FaInfoCircle': IoInformationCircle,
  'FaMobileAlt': IoPhonePortrait
};

// Segédfüggvény: Telefonszámok linkké alakítása (Glassmorphic gombok)
const linkifyPhones = (text) => {
  if (!text) return "";
  const phoneRegex = /(\+?\d{2}[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})/g;
  const parts = text.split(phoneRegex);

  return parts.map((part, i) => {
    if (phoneRegex.test(part)) {
      return (
        <a
          key={i}
          href={`tel:${part.replace(/\s/g, '')}`}
          className="
            inline-flex items-center gap-2 mt-3
            bg-indigo-500/10 dark:bg-indigo-400/20 
            text-indigo-600 dark:text-indigo-300 
            px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest 
            transition-all duration-300 hover:scale-105 hover:bg-indigo-500/20 dark:hover:bg-indigo-400/30
            border border-indigo-500/10
          "
        >
          <IoCall className="text-sm" />
          {part}
        </a>
      );
    }
    return <span key={i} className="text-gray-600 dark:text-gray-300 relaxed">{part}</span>;
  });
};

export default function Info() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfo()
      .then(data => setItems(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [items]);

  const categoryOrder = [
    { key: 'app', title: 'KőszegAPP', color: 'from-violet-600 to-indigo-600', text: 'text-white', icon: IoFlash, fullWidth: true },
    { key: 'emergency', title: 'Segélyhívók', color: 'from-rose-500 to-red-600', text: 'text-rose-600', icon: IoShieldCheckmark },
    { key: 'health', title: 'Egészségügy', color: 'from-emerald-500 to-teal-600', text: 'text-teal-600', icon: IoMedkit },
    { key: 'tourism', title: 'Turizmus', color: 'from-sky-500 to-blue-600', text: 'text-sky-600', icon: IoLeaf },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-40 pt-6 px-4 sm:px-6 relative bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">

      {/* --- Header --- */}
      <div className="max-w-4xl mx-auto mb-10 relative z-10 flex items-center justify-between">
        <FadeUp>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">
              Információk
            </h1>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Városi központ és segélyhívók.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <Link to="/" className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
            <IoArrowBack className="text-xl text-gray-900 dark:text-white" />
          </Link>
        </FadeUp>
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">

        {categoryOrder.map(({ key, title, color, icon: CatIcon, fullWidth }) => {
          if (!groupedItems[key]) return null;

          return (
            <section key={key}>

              {/* Címsor, kivéve az App szekciót, ott a kártya beszél */}
              {key !== 'app' && (
                <FadeUp className="flex items-center gap-3 mb-6">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-none`}>
                    <CatIcon className="text-white text-sm" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {title}
                  </h2>
                </FadeUp>
              )}

              <div className={`grid grid-cols-1 ${key === 'app' ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 md:gap-5`}>
                {groupedItems[key].map((item, idx) => {
                  const IconComponent = (item.icon && iconMap[item.icon]) || IoInformationCircle;

                  // --- FEATURE SHOWCASE CARD (APP) ---
                  if (key === 'app') {
                    return (
                      <FadeUp key={item.id} className="w-full">
                        <div className="
                          relative overflow-hidden group w-full
                          bg-black dark:bg-[#111]
                          rounded-[2.5rem] p-8 md:p-10
                          shadow-2xl shadow-indigo-500/10
                        ">
                          {/* Ambient Glows */}
                          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">

                            {/* Icon / Brand */}
                            <div className="shrink-0 relative">
                              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#2c2c2e] to-black border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 opacity-50" />
                                <IoFlash className="text-5xl text-white" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                                {item.title}
                              </h3>
                              <p className="text-lg md:text-xl font-medium text-gray-400 mb-6 leading-relaxed max-w-2xl">
                                {item.content}
                              </p>

                              {/* Feature Pills */}
                              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                  <IoCloudOffline className="text-indigo-400" />
                                  <span className="text-sm font-bold text-white">Offline Ready</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                  <IoWifi className="text-emerald-400" />
                                  <span className="text-sm font-bold text-white">Smart City</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                  <IoLeaf className="text-teal-400" />
                                  <span className="text-sm font-bold text-white">Zero Carbon</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Link to="/about" className="
                               relative group/btn overflow-hidden
                               bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest
                               hover:scale-105 transition-transform duration-300 shadow-xl shadow-white/10
                             ">
                              <span className="relative z-10 flex items-center gap-2">
                                Tovább <IoChevronForward />
                              </span>
                            </Link>

                          </div>
                        </div>
                      </FadeUp>
                    );
                  }

                  // --- STANDARD INFO CARD ---
                  return (
                    <FadeUp key={item.id} delay={idx * 0.05} className="h-full">
                      <div className="
                         group relative h-full flex flex-col justify-between
                         bg-white dark:bg-[#1c1c1e] 
                         border border-gray-100 dark:border-white/5
                         p-6 rounded-[2rem]
                         shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none
                         transition-all duration-500 hover:-translate-y-1
                      ">
                        <div className="mb-4">
                          <div className={`
                             w-12 h-12 rounded-2xl flex items-center justify-center text-white
                             bg-gradient-to-br ${color}
                             shadow-lg shadow-gray-200 dark:shadow-none
                             group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500
                           `}>
                            <IconComponent className="text-xl" />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h3>
                          <div className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
                            {linkifyPhones(item.content)}
                          </div>
                        </div>
                      </div>
                    </FadeUp>
                  );

                })}
              </div>
            </section>
          );
        })}
      </div>

    </div>
  );
}
