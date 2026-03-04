import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Cloud,
    CloudRain,
    Sun,
    Moon,
    Calendar,
    ArrowRight,
    Ticket,
    Clock,
    MapPin,
    TrendingUp,
    Wind,
    Droplets
} from 'lucide-react';
import { isAfter, isBefore, differenceInSeconds, format } from 'date-fns';
import { Link } from 'react-router-dom';

const LiveHero = ({ appData, weather }) => {
    const { t, i18n } = useTranslation('home');
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        if (hour >= 5 && hour < 10) return t('liveHero.greetingMorning');
        if (hour >= 10 && hour < 18) return t('liveHero.greetingDay');
        if (hour >= 18 && hour < 22) return t('liveHero.greetingEvening');
        return t('liveHero.greetingNight');
    }, [now, t]);

    const { upcomingEvents, runningEvents } = useMemo(() => {
        if (!appData?.events || appData.events.length === 0) return { upcomingEvents: [], runningEvents: [] };

        const upcoming = appData.events
            .filter(e => isAfter(e._e, now))
            .sort((a, b) => a._s - b._s);

        const running = upcoming.filter(e => isBefore(e._s, now) && isAfter(e._e, now));
        const strictlyUpcoming = upcoming.filter(e => isAfter(e._s, now));

        return { upcomingEvents: strictlyUpcoming, runningEvents: running };
    }, [appData?.events, now]);

    const nextEvent = useMemo(() => {
        if (runningEvents.length > 0) return runningEvents[0];
        return upcomingEvents[0] || null;
    }, [runningEvents, upcomingEvents]);

    const otherEventsCount = useMemo(() => {
        if (runningEvents.length > 0) return runningEvents.length - 1;
        if (upcomingEvents.length > 0) {
            const firstStart = upcomingEvents[0]._s;
            // Count how many others start at the same time
            return upcomingEvents.filter(e => e.id !== upcomingEvents[0].id && e._s.getTime() === firstStart.getTime()).length;
        }
        return 0;
    }, [runningEvents, upcomingEvents]);

    const isRunning = useMemo(() => {
        if (!nextEvent) return false;
        return isBefore(nextEvent._s, now) && isAfter(nextEvent._e, now);
    }, [nextEvent, now]);

    const timeToStart = useMemo(() => {
        if (!nextEvent || isRunning) return null;
        const diff = differenceInSeconds(nextEvent._s, now);
        if (diff < 0) return null;

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        return { hours, minutes, seconds };
    }, [nextEvent, isRunning, now]);

    const weatherIcon = useMemo(() => {
        if (!weather?.icon) return <Sun className="w-6 h-6 text-yellow-400" />;
        const code = weather.icon;
        if (code.includes('01') || code.includes('02')) return <Sun className="w-10 h-10 text-yellow-400" />;
        if (code.includes('03') || code.includes('04')) return <Cloud className="w-10 h-10 text-slate-400" />;
        if (code.includes('09') || code.includes('10')) return <CloudRain className="w-10 h-10 text-blue-400" />;
        if (code.includes('11')) return <Wind className="w-10 h-10 text-indigo-400" />;
        return <Sun className="w-10 h-10 text-yellow-400" />;
    }, [weather]);

    const weatherDesc = useMemo(() => {
        if (!weather?.icon) return '';
        const code = weather.icon;
        if (code.includes('01')) return 'Ragyogó napsütés';
        if (code.includes('02')) return 'Kevés felhő, kellemes idő';
        if (code.includes('03')) return 'Felhős az égbolt';
        if (code.includes('04')) return 'Borús, szürke idő';
        if (code.includes('09')) return 'Szemerkél az eső';
        if (code.includes('10')) return 'Esős időjárás';
        if (code.includes('11')) return 'Viharos az idő';
        if (code.includes('13')) return 'Szállingózik a hó';
        if (code.includes('50')) return 'Párás, ködös levegő';
        return '';
    }, [weather]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full mb-8"
        >
            {/* Main Glass Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(31,38,135,0.15)] p-6 md:p-8">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                    {/* Left Section: Greeting & Weather */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                {weatherIcon}
                            </motion.div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight">
                                    {greeting}
                                </h1>
                                <div className="flex flex-col mt-0.5">
                                    {weatherDesc && (
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest opacity-80 mb-0.5">
                                            {weatherDesc}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Droplets className="w-4 h-4 text-blue-400" />
                                            {weather?.temp || '--'}°C
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                        <span>{format(now, 'HH:mm')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Next Event / Magic CTA */}
                    {nextEvent && (
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="w-full md:w-auto min-w-[280px]"
                        >
                            <Link to={`/events/${nextEvent.id}`} className="block group">
                                <div className="relative p-4 rounded-3xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-xl ${isRunning ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'} text-white`}>
                                                {isRunning ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {isRunning ? t('liveHero.nowAt') : t('liveHero.nextEvent')}
                                                {otherEventsCount > 0 && (
                                                    <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                                                        +{otherEventsCount}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                        {nextEvent.nev?.[i18n.language] || nextEvent.nev?.hu || nextEvent.name}
                                    </h2>

                                    {/* Countdown or Status */}
                                    <div className="flex items-center gap-3">
                                        {timeToStart ? (
                                            <div className="flex items-baseline gap-1 font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                                {timeToStart.hours > 0 && (
                                                    <><span className="text-2xl">{timeToStart.hours}</span><span className="text-xs uppercase mr-1">h</span></>
                                                )}
                                                <span className="text-2xl">{String(timeToStart.minutes).padStart(2, '0')}</span><span className="text-xs uppercase mr-1">m</span>
                                                <span className="text-2xl">{String(timeToStart.seconds).padStart(2, '0')}</span><span className="text-xs uppercase">s</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                                                <TrendingUp className="w-4 h-4" />
                                                <span>LIVE NOW</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                            <MapPin className="w-3 h-3" />
                                            <span className="line-clamp-1">
                                                {nextEvent.helyszin?.nev?.[i18n.language] || nextEvent.helyszin?.nev?.hu || nextEvent.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                    {!nextEvent && (
                        <Link to="/events" className="w-full md:w-auto">
                            <button className="w-full px-8 py-4 rounded-3xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/30">
                                {t('liveHero.ctaEvents')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    )}
                </div>

            </div>
        </motion.div>
    );
};

export default LiveHero;
