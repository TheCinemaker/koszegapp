import React, { useContext, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Navigation, Coffee, Utensils, Pizza, Beer, IceCream, Landmark, Camera, Footprints, RotateCcw } from 'lucide-react';
import { LocationContext } from '../contexts/LocationContext';
import { Link } from 'react-router-dom';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const formatHumanDistance = (distKm) => {
    const m = distKm * 1000;
    if (m < 50) return "Itt a szomszédban!";
    if (m < 150) return "Csak egy köpésre tőled.";
    if (m < 300) return "Pár lépés tőled a sarkon.";
    if (m < 600) return "Két-három perc séta tőled.";
    return "Egy kis séta, de megéri!";
};

const getContextualSettings = (mode) => {
    const hour = new Date().getHours();
    
    // SÉTA MÓD (Fókuszban a nevezetességek)
    if (mode === 'walking') {
        return {
            categories: ['attraction'],
            icon: Landmark,
            greetings: [
                "Nézd, milyen szép ez az épület melletted!",
                "Kőszegi titok a sarkon, nézz be ide!",
                "Szia! Ezt a nevezetességet ismered már?",
                "Tipp: Itt a közelben van valami érdekes!",
                "Sétálj egy kicsit erre, megéri!"
            ]
        };
    }

    // KONTEXTUS MÓD (Gasztro focus by time)
    if (hour >= 5 && hour < 10) return {
        categories: ['pékség', 'tejivó'],
        icon: Coffee,
        greetings: [
            "Szia! Egy friss péksütit reggelire?",
            "Jó reggelt! Tudok egy szuper reggelizőhelyet.",
            "Indítsd a napot egy finom falattal!"
        ]
    };
    
    if ((hour >= 10 && hour < 12) || (hour >= 15 && hour < 17)) return {
        categories: ['kávézó', 'cukrászda'],
        icon: Coffee,
        greetings: [
            "Mit szólnál egy tökéletes kávéhoz?",
            "Jöhet egy kis kávészünet?",
            "Itt van melletted egy hangulatos hely egy kávéra."
        ]
    };

    if (hour >= 12 && hour < 15) return {
        categories: ['étterem', 'pizzéria'],
        icon: Utensils,
        greetings: [
            "Itt az ebédidő, nézd mit találtam!",
            "Megéheztél? Szuper ebédlehetőség a közelben:",
            "Szia! Egy jó ebéd a szomszédban?"
        ]
    };

    if (hour >= 17 && hour < 18) return {
        categories: ['fagyizó', 'cukrászda'],
        icon: IceCream,
        greetings: [
            "Jöhet egy hűsítő kézműves fagyi?",
            "Egy kis délutáni édesség a sarkon?",
            "Nézd csak, itt egy remek sütiző!"
        ]
    };

    if (hour >= 18 && hour < 21) return {
        categories: ['étterem', 'pizzéria'],
        icon: Pizza,
        greetings: [
            "Esti falatok? Itt egy remek tipp:",
            "Mit szólnál egy hangulatos vacsorához?",
            "Befejezésül egy jó pizza vagy magyaros fogás?"
        ]
    };

    if (hour >= 21 || hour < 5) return {
        categories: ['borozó', 'söröző'],
        icon: Beer,
        greetings: [
            "Zárásként egy jó fröccs vagy sör?",
            "Itt a borozás ideje Kőszeg szívében:",
            "Keresel egy hangulatos helyet az estére?"
        ]
    };

    return { categories: [], icon: Landmark, greetings: ["Fedezd fel Kőszeget!"] };
};

const NearbyDiscoveryCard = ({ appData }) => {
    const { location, startWatching, stopWatching } = useContext(LocationContext);
    const [greetingIndex, setGreetingIndex] = useState(0);
    const [mode, setMode] = useState('contextual'); // 'contextual' or 'walking'

    useEffect(() => {
        startWatching();
        const interval = setInterval(() => {
            setGreetingIndex(prev => (prev + 1) % 5);
        }, 15000); // Shift greetings faster
        return () => {
            stopWatching();
            clearInterval(interval);
        };
    }, []);

    const closestItem = useMemo(() => {
        if (!location || (!appData?.restaurants && !appData?.attractions)) return null;

        const settings = getContextualSettings(mode);
        
        let pool = [];
        if (mode === 'walking') {
            pool = (appData.attractions || []).map(a => ({ ...a, type: 'attraction', to: `/attractions/${a.id}`, icon: Camera }));
        } else {
            pool = (appData.restaurants || [])
                .filter(r => settings.categories.includes(r.type))
                .map(r => ({ ...r, type: 'gastro', to: `/gastronomy/${r.id}`, icon: settings.icon }));
            
            // Fallback to attractions if no matching gastro
            if (pool.length === 0) {
                pool = (appData.attractions || []).map(a => ({ ...a, type: 'attraction', to: `/attractions/${a.id}`, icon: Camera }));
            }
        }

        if (pool.length === 0) return null;

        const sorted = pool.sort((a, b) => {
            const latA = a.coords?.lat || a.coordinates?.lat;
            const lngA = a.coords?.lng || a.coordinates?.lng;
            const latB = b.coords?.lat || b.coordinates?.lat;
            const lngB = b.coords?.lng || b.coordinates?.lng;
            const distA = calculateDistance(location.lat, location.lng, latA, lngA);
            const distB = calculateDistance(location.lat, location.lng, latB, lngB);
            return distA - distB;
        });

        const closest = sorted[0];
        const latCl = closest.coords?.lat || closest.coordinates?.lat;
        const lngCl = closest.coords?.lng || closest.coordinates?.lng;
        const dist = calculateDistance(location.lat, location.lng, latCl, lngCl);
        
        return {
            ...closest,
            humanDist: formatHumanDistance(dist),
            greeting: settings.greetings[greetingIndex % settings.greetings.length],
            settingsIcon: closest.icon || settings.icon || Landmark
        };
    }, [location, appData, greetingIndex, mode]);

    const Icon = closestItem?.settingsIcon || Landmark;

    return (
        <div className="mb-8 relative">
            <AnimatePresence mode="wait">
                {!location ? (
                    <motion.div 
                        key="searching"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 flex items-center justify-center gap-3"
                    >
                        <Navigation className="w-4 h-4 text-indigo-500 animate-spin" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            GPS jel keresése...
                        </span>
                    </motion.div>
                ) : closestItem && (
                    <motion.div
                        key={`${mode}-${closestItem.id}`}
                        initial={{ opacity: 0, x: mode === 'walking' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative group"
                    >
                        {/* THE CARD CONTENT */}
                        <div className="relative overflow-hidden rounded-[2.2rem] bg-white dark:bg-zinc-900 border-2 border-indigo-500/10 dark:border-indigo-500/20 shadow-2xl transition-all duration-500 group-hover:border-indigo-500/40">
                            
                            {/* Mode Toggle Button (Floating Top-Right) */}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMode(mode === 'contextual' ? 'walking' : 'contextual');
                                }}
                                className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                {mode === 'contextual' ? (
                                    <><Footprints className="w-3 h-3" /> Csak sétálok</>
                                ) : (
                                    <><RotateCcw className="w-3 h-3" /> Gasztro tippek</>
                                )}
                            </button>

                            <Link to={closestItem.to} className="block p-7">
                                {/* Background Decor */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-500/10 transition-colors" />

                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className={`p-4 rounded-3xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${mode === 'walking' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                                                {closestItem.greeting}
                                            </p>
                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'walking' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-2">
                                            {closestItem.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wide">
                                                {closestItem.humanDist}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="self-end sm:self-center bg-slate-100 dark:bg-white/5 p-4 rounded-2xl text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NearbyDiscoveryCard;
