
import React, { useState, useEffect, useMemo } from 'react';
import { fetchInfo } from '../api';
import { Link } from 'react-router-dom';
import {
  IoMedkitOutline,
  IoFlameOutline,
  IoPawOutline,
  IoInformationCircleOutline,
  IoCallOutline,
  IoPhonePortraitOutline,
  IoShieldCheckmarkOutline,
  IoLeafOutline,
  IoArrowBack,
  IoChevronForward
} from 'react-icons/io5';
import { FadeUp } from '../components/AppleMotion';

// Ikon-leképezés (Io5 verziók)
const iconMap = {
  'FaAmbulance': IoMedkitOutline,
  'FaFirstAid': IoMedkitOutline,
  'FaFireExtinguisher': IoFlameOutline,
  'FaPills': IoMedkitOutline,
  'FaPaw': IoPawOutline,
  'FaInfoCircle': IoInformationCircleOutline,
  'FaMobileAlt': IoPhonePortraitOutline
};

// Segédfüggvény: Telefonszámok linkké alakítása (Stílusos gombok)
const linkifyPhones = (text) => {
  if (!text) return "";
  const phoneRegex = /(\+?\d{2}[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})/g;
  const parts = text.split(phoneRegex);

  return parts.map((part, i) => {
    if (phoneRegex.test(part)) {
      return (
        <a
          key={i}
          href={`tel:${part.replace(/\s/g, '')} `}
          className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/30 mt-2 border border-indigo-200 dark:border-indigo-500/30"
        >
          <IoCallOutline className="text-sm" />
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
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
    { key: 'emergency', title: 'Segélyhívók', color: 'from-rose-500 to-red-600', text: 'text-rose-600', icon: IoShieldCheckmarkOutline },
    { key: 'health', title: 'Egészségügy', color: 'from-emerald-400 to-teal-500', text: 'text-teal-600', icon: IoMedkitOutline },
    { key: 'tourism', title: 'Turizmus', color: 'from-sky-400 to-blue-500', text: 'text-sky-600', icon: IoLeafOutline },
    { key: 'app', title: 'Az Alkalmazásról', color: 'from-violet-500 to-purple-600', text: 'text-violet-600', icon: IoInformationCircleOutline }
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-3xl mx-auto relative z-10">

        {/* 1. SIMPLE HEADER */}
        <FadeUp className="flex items-center gap-4 mb-8">
          <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-colors shadow-sm">
            <IoArrowBack className="text-xl text-gray-900 dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">
              Információk
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
              Közérdekű adatok és segélyhívók.
            </p>
          </div>
        </FadeUp>

        <div className="space-y-10">
          {categoryOrder.map(({ key, title, color, icon: CatIcon }) => (
            groupedItems[key] && (
              <section key={key} className="relative">
                {/* Section Title */}
                <FadeUp delay={0.1} className="flex items-center gap-3 mb-5 pl-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                    <CatIcon className="text-lg" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
                </FadeUp>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedItems[key].map((item, idx) => {
                    const fallbackIcon = IoInformationCircleOutline;
                    // Ikon mapelés string alapjan
                    const IconComponent = item.icon && iconMap[item.icon] ? iconMap[item.icon] : fallbackIcon;

                    const isFeature = item.id === 'info-99'; // "Rólunk" card

                    // --- FEATURE CARD (Rólunk) ---
                    if (isFeature) {
                      return (
                        <FadeUp key={item.id} delay={idx * 0.1 + 0.2} className="md:col-span-2">
                          <Link
                            to="/about"
                            className="
                                    relative overflow-hidden group block
                                    bg-gradient-to-br from-[#1c1c1e] to-[#2c2c1e] dark:from-black dark:to-[#1c1c1e]
                                    rounded-[2rem] p-8 text-white shadow-2xl hover:shadow-indigo-500/20
                                    transition-all duration-700 hover:scale-[1.01]
                                "
                          >
                            {/* Abstract Background */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>

                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                              <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-700">
                                <IconComponent className="text-4xl text-white drop-shadow-lg" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-3xl font-bold mb-2 tracking-tight">KőszegAPP</h3>
                                <p className="text-gray-300 text-sm leading-relaxed max-w-lg mb-6 desc-text font-medium opacity-90">
                                  Nem csak egy app. Kőszeg digitális szövetének része. Offline térkép, Valós idejű események, Intelligens városirányítás. A jövő megérkezett.
                                </p>
                                <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-transform duration-300 group-hover:scale-105 shadow-lg shadow-white/10">
                                  Tovább <IoChevronForward />
                                </span>
                              </div>
                            </div>
                          </Link>
                        </FadeUp>
                      );
                    }

                    // --- STANDARD CARD ---
                    return (
                      <FadeUp key={item.id} delay={idx * 0.1 + 0.1}>
                        <div className="
                            group relative h-full
                            bg-white/70 dark:bg-white/5 
                            backdrop-blur-[20px] backdrop-saturate-[1.6]
                            border border-white/60 dark:border-white/10
                            rounded-[1.8rem] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10
                            transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]
                            flex flex-col
                            ">
                          <div className="flex items-start gap-4">
                            {/* Icon Box */}
                            <div className={`
                              w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0
                              bg-gradient-to-br ${color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500
                            `}>
                              <IconComponent className="text-xl" />
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                                {item.title}
                              </h3>
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed break-words">
                                {linkifyPhones(item.content)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </FadeUp>
                    );
                  })}
                </div>
              </section>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

