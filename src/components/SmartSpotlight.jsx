import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSparkles, IoChevronForward, IoClose } from 'react-icons/io5';
import { differenceInCalendarDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartSpotlight Display (Gigaluxus Floating Banner)
 * Promotes highlighted events (e.g. Ostromnapok, Várszínház) in a sleek Éjkék + Régi Arany floating pill.
 */
export default function SmartSpotlight({ appData }) {
    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(false);

    // Find the most relevant highlight event
    const activeHighlight = useMemo(() => {
        if (!appData || !appData.events) return null;

        const today = new Date();
        const highlightedEvents = appData.events.filter(event => event.highlight === true);

        const validHighlights = highlightedEvents.filter(event => {
            const startDate = event._s || parseISO(event.date);
            const endDate = event._e || parseISO(event.end_date || event.date);

            const showFromDate = addDays(startDate, -21);
            const hideAfterDate = addDays(endDate, 1);

            return isAfter(today, showFromDate) && isBefore(today, hideAfterDate);
        });

        validHighlights.sort((a, b) => {
            const dateA = a._s || parseISO(a.date);
            const dateB = b._s || parseISO(b.date);
            return dateA - dateB;
        });

        return validHighlights[0] || null;
    }, [appData]);

    if (!activeHighlight) return null;

    const startDate = activeHighlight._s || parseISO(activeHighlight.date);
    const today = new Date();
    const daysLeft = differenceInCalendarDays(startDate, today);

    let statusText = "";
    if (daysLeft < 0) statusText = "Zajlik most";
    else if (daysLeft === 0) statusText = "Ma kezdődik!";
    else if (daysLeft === 1) statusText = "Holnap!";
    else statusText = `${daysLeft} nap múlva`;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed bottom-24 left-0 right-0 z-40 flex pointer-events-none px-4 ${isMinimized ? 'justify-end sm:pr-6' : 'justify-center'}`}
            >
                {isMinimized ? (
                    // --- MINIMIZED STATE: Sleek Gold/Éjkék Bubble ---
                    <motion.div
                        layoutId="spotlight-container"
                        onClick={() => setIsMinimized(false)}
                        className="
                          pointer-events-auto cursor-pointer
                          w-12 h-12 rounded-full
                          bg-brand dark:bg-brand
                          border border-gold/40
                          shadow-card
                          flex items-center justify-center
                          hover:scale-105 active:scale-95 transition-transform duration-300
                        "
                    >
                        <IoSparkles className="text-gold-light text-xl" />
                        <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-gold rounded-full border-2 border-brand" />
                    </motion.div>
                ) : (
                    // --- EXPANDED STATE: Gigaluxus Banner ---
                    <motion.div
                        layoutId="spotlight-container"
                        transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
                        className="
                          pointer-events-auto
                          flex items-center gap-3 md:gap-4
                          bg-brand dark:bg-brand
                          border border-gold/40
                          pl-2 pr-2.5 py-2 rounded-full
                          shadow-card
                          group
                        "
                    >
                        {/* Clickable Area for Navigation */}
                        <div
                            onClick={() => navigate(`/events/${activeHighlight.id}`)}
                            className="flex items-center gap-2 md:gap-3 cursor-pointer"
                        >
                            {/* Icon Box */}
                            <div className="
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                bg-gold/20 text-gold-light border border-gold/30
                            ">
                                <IoSparkles className="text-gold-light text-sm" />
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col min-w-[80px] max-w-[160px] sm:max-w-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-light leading-none mb-0.5">
                                    {activeHighlight.highlightLabel || "Kiemelt rendezvény"}
                                </span>
                                <span className="text-xs md:text-sm font-bold text-white truncate leading-none">
                                    {activeHighlight.name}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-6 bg-gold/20 mx-0.5 hidden sm:block" />

                            {/* Status Badge */}
                            <div className="flex items-center bg-gold/15 px-2.5 py-1 rounded-full border border-gold/30 shrink-0 group-hover:bg-gold/25 transition-colors">
                                <span className="text-[10px] sm:text-xs font-bold text-gold-light whitespace-nowrap">
                                    {statusText}
                                </span>
                                <IoChevronForward className="text-gold-light ml-0.5 text-xs group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>

                        {/* Close / Minimize Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className="
                              w-7 h-7 flex items-center justify-center rounded-full
                              bg-white/10 hover:bg-white/20
                              transition-colors duration-200
                              text-gold-light/80 hover:text-white
                              ml-1
                            "
                            aria-label="Bezárás"
                        >
                            <IoClose className="text-base" />
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
