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
    Droplets,
    Mountain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VisitKoszegLogo from './VisitKoszegLogo';

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full mb-8"
        >
            {/* Main Glass Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(31,38,135,0.15)] p-6 md:p-8">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                    {/* Left Section: Greeting & Weather Button */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-text dark:text-gold-light mb-1.5">
                                visitKőszeg
                            </p>
                            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight mb-2">
                                {greeting}
                            </h1>
                        <div className="flex flex-col items-start">
                            <Link
                                to="/weather"
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group active:scale-95 text-gray-800 dark:text-white shadow-sm"
                            >
                                <Mountain className="w-5 h-5 text-gold-text dark:text-gold-light shrink-0" />
                                <div className="text-left">
                                    <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight mb-0.5">
                                        Időjárás
                                    </div>
                                    <div className="text-[10px] font-bold text-gold-text dark:text-gold-light uppercase tracking-widest leading-none flex items-center gap-1.5">
                                        Helyi mérések alapján
                                        <ArrowRight className="w-3 h-3 text-gold-text dark:text-gold-light group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                            <a 
                                href="https://kiemet.hu" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-gold-text dark:hover:text-gold-light transition-colors px-1"
                            >
                                Minden adat: kiemet.hu
                            </a>
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
                                <div className="relative p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isRunning ? 'bg-rose-500 animate-pulse' : 'bg-brand'} text-white`}>
                                                {isRunning ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {isRunning ? t('liveHero.nowAt') : t('liveHero.nextEvent')}
                                                {otherEventsCount > 0 && (
                                                    <span className="ml-2 text-[10px] bg-gold/15 text-gold-text dark:text-gold-light px-1.5 py-0.5 rounded-full border border-gold/30">
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
                                            <div className="flex items-baseline gap-1 font-mono text-xl font-black text-gold-text dark:text-gold-light">
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
                            <button className="w-full px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/30">
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
