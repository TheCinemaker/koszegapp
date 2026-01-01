import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSparkles, IoCalendarOutline, IoChevronForward, IoClose } from 'react-icons/io5';
import { differenceInCalendarDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartSpotlight Display
 * Automatically promotes events tagged with "highlight": true in JSON.
 * Shows up within 10 days of the event start date.
 * 
 * Interaction:
 * - Initially Expanded.
 * - User can minimize with 'X'.
 * - Minimized state shows a small bubble.
 * - Clicking bubble expands it again.
 */
export default function SmartSpotlight({ appData }) {
    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(false);

    // Logic: Find the most relevant highlight event
    const activeHighlight = useMemo(() => {
        if (!appData || !appData.events) return null;

        const today = new Date();

        // 1. Filter for highlighted events
        const highlightedEvents = appData.events.filter(event => event.highlight === true);

        // 2. Filter for date validity (Show from 10 days before until end date)
        const validHighlights = highlightedEvents.filter(event => {
            const startDate = event._s || parseISO(event.date);
            const endDate = event._e || parseISO(event.end_date || event.date);

            const showFromDate = addDays(startDate, -10);
            const hideAfterDate = addDays(endDate, 1);

            return isAfter(today, showFromDate) && isBefore(today, hideAfterDate);
        });

        // 3. Sort by closest start date
        validHighlights.sort((a, b) => {
            const dateA = a._s || parseISO(a.date);
            const dateB = b._s || parseISO(b.date);
            return dateA - dateB;
        });

        return validHighlights[0] || null;

    }, [appData]);


    if (!activeHighlight) return null;

    // Calculate generic text
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
                layout
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`fixed bottom-24 left-0 right-0 z-40 flex pointer-events-none px-4 ${isMinimized ? 'justify-end sm:pr-6' : 'justify-center'}`}
            >
                {isMinimized ? (
                    // --- MINIMIZED STATE ---
                    <motion.div
                        layoutId="spotlight-container"
                        onClick={() => setIsMinimized(false)}
                        className="
              pointer-events-auto cursor-pointer
              w-12 h-12 rounded-full
              bg-[#1c1c1e]/80 dark:bg-black/60
              backdrop-blur-xl backdrop-saturate-150
              border border-white/20 dark:border-white/10
              shadow-[0_8px_32px_rgba(0,0,0,0.2)]
              flex items-center justify-center
              hover:scale-110 active:scale-95 transition-transform duration-300
            "
                    >
                        <IoSparkles className="text-white text-xl animate-pulse-slow" />
                        {/* Notification Dot */}
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1c1c1e]"></div>
                    </motion.div>
                ) : (
                    // --- EXPANDED STATE ---
                    <motion.div
                        layoutId="spotlight-container"
                        className="
              pointer-events-auto
              flex items-center gap-3 md:gap-4
              bg-[#1c1c1e]/90 dark:bg-black/80
              backdrop-blur-xl backdrop-saturate-150
              border border-white/20 dark:border-white/10
              pl-3 pr-2 py-2.5 rounded-full
              shadow-[0_8px_32px_rgba(0,0,0,0.3)]
              group
            "
                    >
                        {/* Clickable Area for Navigation */}
                        <div
                            onClick={() => navigate(`/events/${activeHighlight.id}`)}
                            className="flex items-center gap-3 md:gap-4 cursor-pointer"
                        >
                            {/* Icon Box */}
                            <div className="
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                bg-gradient-to-br from-indigo-500 to-purple-600
                shadow-lg shadow-purple-500/20
              ">
                                <IoSparkles className="text-white text-lg" />
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col min-w-[140px] max-w-[200px] sm:max-w-xs">
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-purple-300">
                                    {activeHighlight.highlightLabel || "Kiemelt Esemény"}
                                </span>
                                <span className="text-sm md:text-base font-bold text-white truncate leading-tight">
                                    {activeHighlight.name}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

                            {/* Status Badge */}
                            <div className="flex items-center bg-white/10 px-3 py-1 rounded-full border border-white/5 shrink-0 group-hover:bg-white/20 transition-colors">
                                <span className="text-xs font-bold text-white whitespace-nowrap">
                                    {statusText}
                                </span>
                                <IoChevronForward className="text-white/50 ml-1 text-sm group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>

                        {/* Close / Minimize Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className="
                 w-8 h-8 flex items-center justify-center rounded-full
                 bg-white/5 hover:bg-white/20
                 transition-colors duration-200
                 text-gray-400 hover:text-white
                 ml-1
               "
                            aria-label="Bezárás"
                        >
                            <IoClose className="text-lg" />
                        </button>

                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
