import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    IoArrowBack,
    IoChevronForward,
    IoFastFood,
    IoTicket,
    IoMap,
    IoGameController,
    IoWallet,
    IoShieldCheckmark,
    IoCart,
    IoTimer,
    IoLocation,
    IoQrCode,
    IoBook,
    IoStar,
    IoInformationCircle,
    IoSparkles,
    IoHeart,
    IoCalendar,
    IoCamera,
    IoNotifications,
    IoCompass
} from 'react-icons/io5';
import { FadeUp } from '../components/AppleMotion';

// --- PASSION POCKET (THE ARCOSKODÁS - DEEP DARK) ---
const PassionPocket = ({ title, text, stats }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-10% 0px -10% 0px", once: false });

    return (
        <section ref={ref} className="py-24 md:py-48 px-6 relative overflow-hidden bg-transparent">
            <div className="absolute top-0 left-0 w-full h-px bg-white/5" />
            <div className="max-w-5xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="inline-flex items-center gap-2 mb-10 text-white/30 font-black text-[10px] uppercase tracking-[0.5em]">
                        <IoHeart className="text-white" /> Passion Project
                    </div>
                    <h3 className="text-4xl md:text-8xl font-black mb-12 tracking-tighter leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                        {title}
                    </h3>
                    <p className="text-xl md:text-3xl font-medium text-white/60 max-w-4xl mx-auto leading-relaxed mb-20 italic">
                        "{text}"
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-4xl md:text-6xl font-black tracking-tighter mb-2 text-white">
                                    {stat.value}
                                </span>
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] leading-none">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// --- ENRICHED MANUAL STEP (DEEP DARK) ---
const ManualStep = ({ title, desc, icon: Icon, scrollContainer }) => {
    const ref = useRef(null);

    // Apple-style reveal storytelling motor (Fixed offset for film-like feel)
    const { scrollYProgress } = useScroll({
        target: ref,
        ...(scrollContainer && scrollContainer.current ? { container: scrollContainer } : {}),
        offset: ["start 90%", "end 40%"]
    });

    // We start at opacity 0.1 rather than 0 so it's not "invisible" if scroll fails
    const opacity = useTransform(scrollYProgress, [0, 0.4], [0.1, 1]);
    const y = useTransform(scrollYProgress, [0, 0.4], [40, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.4], [0.96, 1]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity, y, scale }}
            className="relative mb-8 last:mb-0"
        >
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 md:p-12 rounded-[2.5rem] shadow-2xl transition-all duration-700 group">
                <div className="flex flex-col sm:flex-row items-start gap-8">
                    {/* Breathing Icon - CPU optimized to only run when in view */}
                    <motion.div
                        whileInView={{ scale: [1, 1.05, 1] }}
                        viewport={{ once: false }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-[1.8rem] bg-white/5 flex items-center justify-center text-white text-3xl md:text-4xl border border-white/5 group-hover:scale-110 transition-transform duration-500"
                    >
                        <Icon />
                    </motion.div>
                    <div>
                        <h4 className="font-black text-white/50 mb-3 uppercase text-[11px] tracking-[0.2em]">
                            {title}
                        </h4>
                        <p className="text-white text-lg md:text-2xl leading-relaxed font-semibold tracking-tight">
                            {desc}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- STICKY SECTION (DEEP DARK - ROBUST MOBILE FIX) ---
const StickySection = ({ title, icon: Icon, steps, scrollContainer }) => {
    const sectionRef = useRef(null);

    // Precise scroll logic targeting the detected scroll container
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        ...(scrollContainer && scrollContainer.current ? { container: scrollContainer } : {}),
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 25 });

    return (
        <div ref={sectionRef} className="relative py-24 md:py-48 border-t border-white/10 first:border-none">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:grid md:grid-cols-12 gap-16 lg:gap-24 relative">

                {/* LEFT: STICKY HEADER - FIXING THE MOBILE "STICKY TRAP" */}
                <div className="md:col-span-5">
                    <div className="sticky top-24 md:top-40 lg:top-48 h-fit z-30 py-6 md:py-0 bg-black/80 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-3xl md:rounded-none px-6 md:px-0">
                        <FadeUp>
                            <div className="flex items-center gap-6 mb-8">
                                <motion.div
                                    whileInView={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-white flex items-center justify-center text-black shadow-2xl"
                                >
                                    <Icon className="text-4xl md:text-6xl" />
                                </motion.div>
                                <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none">
                                    {title}
                                </h2>
                            </div>

                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-8">
                                <motion.div
                                    style={{ scaleX: smoothProgress, transformOrigin: "0%" }}
                                    className="h-full bg-white"
                                />
                            </div>

                            <p className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.4em]">
                                VISITKOSZEG Manual • {steps.length} Chapters
                            </p>
                        </FadeUp>
                    </div>
                </div>

                {/* RIGHT: SCROLLING STEPS */}
                <div className="md:col-span-7 space-y-8">
                    {steps.map((step, idx) => (
                        <ManualStep key={idx} {...step} scrollContainer={scrollContainer} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function FeatureShowcase() {
    const rootRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [containerFound, setContainerFound] = useState(false);

    // 🕵️‍♂️ Robust Scroll Container Detection (Essential for AnimatedRoutes/PageWrapper)
    // We look for the closest parent with overflow-y: auto/scroll
    useEffect(() => {
        const findContainer = () => {
            let el = rootRef.current;
            while (el && el !== document.body) {
                const style = window.getComputedStyle(el);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    scrollContainerRef.current = el;
                    setContainerFound(true);
                    return;
                }
                el = el.parentElement;
            }
            // Fallback to window/document
            scrollContainerRef.current = window;
            setContainerFound(true);
        };

        // Give React a frame to mount everything
        const timer = setTimeout(findContainer, 100);
        return () => clearTimeout(timer);
    }, []);

    // Performance Optimized Gradient: Opacity Crossfade (Apple style - DEEP DARK)
    const { scrollYProgress } = useScroll({
        ...(containerFound && scrollContainerRef.current !== window ? { container: scrollContainerRef } : {})
    });

    const bgOpacity2 = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
    const bgOpacity3 = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

    // Hero Parallax Depth + 3D TILT
    const yTitle = useTransform(scrollYProgress, [0, 0.25], [0, -120]);
    const rotateX = useTransform(scrollYProgress, [0, 0.25], [0, 12]);
    const opacityTitle = useTransform(scrollYProgress, [0, 0.2], [1, 0.1]);

    return (
        <div ref={rootRef} className="min-h-screen relative bg-black text-white selection:bg-white selection:text-black pb-40 overflow-visible font-sans perspective-1000">
            {/* 10/10 PERFORMANCE GRADIENTS (Crossfade Layers - DARK) */}
            <div className="fixed inset-0 z-[-2] bg-black" />
            <motion.div style={{ opacity: bgOpacity2 }} className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#000000] to-[#050505]" />
            <motion.div style={{ opacity: bgOpacity3 }} className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#050505] to-[#080810]" />

            {/* NOISE LAYER */}
            <div className="fixed inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none z-0"></div>

            {/* Back Button (DEEP DARK) */}
            <div className="fixed top-8 left-8 z-[100]">
                <Link to="/info" className="w-14 h-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 hover:scale-110 active:scale-90 transition-all shadow-2xl group text-white">
                    <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* HERO - WWDC PARALLAX + TILT (DEEP DARK) */}
            <header className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center max-w-6xl mx-auto py-32 overflow-hidden">
                <FadeUp>
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mb-12 bg-white/5 backdrop-blur-xl">
                        Official VISITKOSZEG Manual
                    </div>
                    <motion.h1
                        style={{ y: yTitle, opacity: opacityTitle, rotateX, transformStyle: "preserve-3d" }}
                        className="text-7xl md:text-[11.5rem] font-black tracking-[-0.04em] mb-10 leading-[0.8] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
                    >
                        Így használd <br /> a várost.
                    </motion.h1>
                    <p className="text-2xl md:text-4xl font-bold text-white/40 leading-tight mb-20 max-w-4xl mx-auto tracking-tight">
                        Minden pixel. Minden funkció. <span className="text-white">Egyetlen letisztult rendszerben.</span> Ez a mi szerelmeslevelünk Kőszeghez.
                    </p>
                    <motion.div
                        animate={{ height: [40, 120, 40] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-[2px] bg-gradient-to-b from-white to-transparent mx-auto opacity-30"
                    />
                </FadeUp>
            </header>

            <main className="max-w-7xl mx-auto overflow-visible relative z-10">

                {/* 1. KŐSZEGEATS */}
                <PassionPocket
                    title="A gasztronómia forradalma."
                    text="Alapjaiból építettük újra a város étkezési kultúráját. Amikor az Eats-en dolgoztunk, nem csak egy rendelőfelületet akartunk, hanem egy hidat az éttermek és köztetek. Több tízezer kódsor, hónapokig finomhangolt logisztika – mert hisszük, hogy a technológia a gyomrot is boldogabbá teheti."
                    stats={[
                        { value: "12.4k", label: "Pure Code" },
                        { value: "0ms", label: "Latency" },
                        { value: "48+", label: "Partners" }
                    ]}
                />
                <StickySection
                    title="KőszegEats" icon={IoFastFood}
                    scrollContainer={scrollContainerRef}
                    steps={[
                        { title: "Smart Discovery", desc: "Fedezd fel a legfrissebb étlapokat retina-felbontású képekkel. Az app tanul az ízlésedből, és mindig a legrelevánsabb fogásokat ajánlja Kőszeg legjobb konyháiból.", icon: IoCompass },
                        { title: "Zero Waste / Mystery Box", desc: "Szívügyünk a fenntarthatóság. Mentett dobozainkban prémium ételeket találsz töredék áron, segítve a várost, hogy egyetlen értékes falat se vesszen kárba.", icon: IoStar },
                        { title: "Loyalty Core", desc: "A hűség nálunk nem bonyolult. Minden 100 Ft költés forintosítható ponttá válik a virtuális tárcádban, amit bárhol, bármikor kedvezményre válthatsz.", icon: IoWallet },
                        { title: "Live Tracking", desc: "Kövesd élőben a futárt a város utcáin. Valós idejű websocket-kapcsolat biztosítja, hogy pontosan tudd: mikor érkezik az élmény az ajtód elé.", icon: IoTimer }
                    ]}
                />

                {/* 2. KŐSZEG QUEST */}
                <PassionPocket
                    title="A történelem a zsebedben."
                    text="A Quest nem egy egyszerű játék. Ez egy tisztelgés Jurisics Miklós és Kőszeg hősei előtt. Heteket töltöttünk a levéltárban és a múzeumokban, hogy minden állomás története hiteles és magával ragadó legyen. A célunk az volt, hogy a telefonod ne elvegyen a városból, hanem hozzáadjon: egy láthatatlan, mágikus réteget."
                    stats={[
                        { value: "1532", label: "Legacy" },
                        { value: "12", label: "Gateways" },
                        { value: "∞", label: "History" }
                    ]}
                />
                <StickySection
                    title="Kőszeg Quest" icon={IoGameController}
                    scrollContainer={scrollContainerRef}
                    steps={[
                        { title: "Időkapu Technológia", desc: "Használd a beépített QR-olvasót az Időkapuk stabilizálásához. Minden szkennelés egy újabb darabot rak helyre a város 500 éves kirakósában.", icon: IoQrCode },
                        { title: "Dual Narrative", desc: "Válaszd a kalandot! 'Felfedező' mód a családoknak, vagy 'Történész' mód azoknak, akik a levéltári adatokra és a mély összefüggésekre szomjaznak.", icon: IoBook },
                        { title: "Status Log", desc: "Minden eredményed rögzül a digitális naplódban. Kövesd a fejlődésed, gyűjtsd a rangokat, és válj te is Kőszeg tiszteletbeli védőjévé.", icon: IoShieldCheckmark },
                        { title: "Knight's Certificate", desc: "A 12 állomás sikeres teljesítése után generálunk neked egy blockchain-hitelesítésű, névre szóló digitális oklevelet, amit büszkén mutathatsz bárkinek.", icon: IoInformationCircle }
                    ]}
                />

                {/* 3. LÁTNIVALÓK & MAP */}
                <PassionPocket
                    title="Minden kőnek története van."
                    text="Hogy kerültek fel a látnivalók? Nem sablonokat töltöttünk meg. Egyenként jártuk végig a helyszíneket, fotóztuk a részleteket és beszéltünk a szakértőkkel. A térképünk nem csak GPS pontok halmaza, hanem Kőszeg digitális dobbanása, ahol a múlt és a jelen összeér."
                    stats={[
                        { value: "150+", label: "POIs" },
                        { value: "4K", label: "Imagery" },
                        { value: "Precise", label: "GPS" }
                    ]}
                />
                <StickySection
                    title="Látnivalók" icon={IoLocation}
                    scrollContainer={scrollContainerRef}
                    steps={[
                        { title: "Smart Map Elite", desc: "Dinamikus, vector-alapú térképünk a napszakhoz igazodik. Esti fények? Esős nap? Az app azonnal jelzi az aktuálisan legvonzóbb pontokat.", icon: IoMap },
                        { title: "Retina Gallery", desc: "Minden látnivalóhoz profi fotósorozat és részletes leírás tartozik. Merülj el a részletekben még mielőtt odaérnél a helyszínre.", icon: IoCamera },
                        { title: "Live Updates", desc: "Lásd élőben a nyitvatartásokat és az aktuális látogatottságot. Kerüld el a tömeget, és élvezd a várost a saját ritmusodban.", icon: IoTimer },
                        { title: "Pathfinding", desc: "Egyetlen érintéssel tervezz útvonalat a szállásodtól a várig vagy bármelyik rejtett kilátóig. Kőszeg titkai sehol nem maradnak elrejtve.", icon: IoCompass }
                    ]}
                />

                {/* 4. ESEMÉNYEK & TICKETS */}
                <PassionPocket
                    title="A pillanat, amit sosem felejtesz."
                    text="A jegyrendszerünk fejlesztésekor a 'nulla hiba' volt a cél. Olyan infrastruktúrát építettünk a VISITKOSZEG mögé, ami bírja a Várszínház rohamát, mégis olyan egyszerű, mint egy üzenetküldés. Stripe és Apple Wallet integráció – mert a kultúra ne a várakozásról szóljon."
                    stats={[
                        { value: "0.2s", label: "Checkout" },
                        { value: "100%", label: "Secure" },
                        { value: "99.9%", label: "Uptime" }
                    ]}
                />
                <StickySection
                    title="Programok" icon={IoCalendar}
                    scrollContainer={scrollContainerRef}
                    steps={[
                        { title: "Live Calendar", desc: "Sose maradj le semmiről. A várost érintő összes koncert, színház és fesztivál egyetlen központi, szinkronizált naptárban érhető el.", icon: IoNotifications },
                        { title: "Instant Ticketing", desc: "Vegyél jegyet várakozás nélkül. A Stripe biztonságos felületén keresztül másodpercek alatt a zsebedben tarthatod a belépődet.", icon: IoFastFood },
                        { title: "Reservation Power", desc: "Foglald le a helyed és fizess a helyszínen. Rugalmas megoldások, amik igazodnak a te igényeidhez és a pillanatnyi döntéseidhez.", icon: IoSparkles },
                        { title: "Wallet Success", desc: "Jegyedet egy kattintással az iPhone Walletbe teheted. Belépésnél csak az órádat vagy a telefonodat kell érintened – internet nélkül is.", icon: IoQrCode }
                    ]}
                />

                {/* 5. SMART CITY & LAKOSSÁG */}
                <PassionPocket
                    title="Okosabb város. Jobb élet."
                    text="Helyiként vagy turistaként – a VISITKOSZEG neked szól. Egy olyan intelligens motort építettünk, ami figyeli a szelet, az esőt és a parkolóhelyeket, hogy te csak a lényegre koncentrálhass. Mert Kőszeg nem csak szép, hanem okos is."
                    stats={[
                        { value: "AI", label: "Personalized" },
                        { value: "Live", label: "Parking" },
                        { value: "Local", label: "Focus" }
                    ]}
                />
                <StickySection
                    title="Smart City" icon={IoShieldCheckmark}
                    scrollContainer={scrollContainerRef}
                    steps={[
                        { title: "Live Parking", desc: "Valós idejű adatok a város parkolóiról. Spórolj időt és üzemanyagot azzal, hogy rögtön a szabad helyekhez navigálunk.", icon: IoLocation },
                        { title: "Adaptive UI", desc: "Az app felülete és javaslatai dinamikusan változnak az időjáráshoz és a napszakhoz igazodva. Mindig a legjobb tippeket kapod.", icon: IoTimer },
                        { title: "Resident Mode", desc: "Kőszegi lakosként extra kiváltságokban részesülsz. Helyi hírek, speciális kedvezmények és közérdekű információk csak neked.", icon: IoInformationCircle },
                        { title: "News Central", desc: "A város lüktetése egyetlen hírfolyamban. Polgármesteri bejelentések, útlezárások és közösségi sikerek – azonnal a mobilodon.", icon: IoNotifications }
                    ]}
                />

            </main>

            {/* CALL TO ACTION - ENRICHED (DEEP DARK) */}
            <section className="py-56 text-center px-6 border-t border-white/10 bg-transparent relative z-10">
                <FadeUp>
                    <h2 className="text-6xl md:text-[12rem] font-black mb-12 tracking-tighter leading-[0.8] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                        A jövő <br /> itt kezdődik.
                    </h2>
                    <p className="max-w-4xl mx-auto text-2xl md:text-4xl font-bold text-white/40 mb-20 leading-tight">
                        A VISITKOSZEG több mint egy szoftver. Ez egy ígéret, hogy a legmodernebb technológia <span className="text-white">mindig kéznél lesz számodra.</span>
                    </p>

                    <Link to="/" className="inline-flex items-center justify-center gap-10 text-5xl md:text-9xl font-black tracking-tighter text-white hover:text-white/40 transition-all duration-1000 group">
                        Indulás <IoChevronForward className="group-hover:translate-x-12 transition-transform duration-1000" />
                    </Link>
                </FadeUp>
            </section>

            {/* FOOTER - APPLE CLEAN (DEEP DARK) */}
            <footer className="py-24 bg-white/[0.02] backdrop-blur-md border-t border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
                    <div className="flex gap-8 opacity-40">
                        <IoLogoApple className="text-2xl" />
                        <div className="w-px h-6 bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">VISITKOSZEG OS 2026</span>
                    </div>
                    <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.6em]">
                        Hivatalos Felhasználói Kézikönyv • Minden jog fenntartva
                    </p>
                    <div className="h-px w-32 bg-white/10" />
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                        Developed with passion by AS Software
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Helper for the Apple Logo in footer
const IoLogoApple = ({ className }) => (
    <svg viewBox="0 0 384 512" width="1em" height="1em" fill="currentColor" className={className}>
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
);
