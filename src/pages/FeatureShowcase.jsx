import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import SEO from '../components/SEO';

// ─── DATA ────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        id: 'home',
        subtitle: 'Főképernyő',
        title: 'Egy város,\negyetlen helyen.',
        desc: 'Élő időjárás, következő esemény visszaszámlálóval, KőszegReels feed — minden, amit Kőszegről tudni érdemes, egyetlen érintésre.',
        image: '/assets/showcase/dashboard_darkmode.png',
        link: '/',
        accent: '#3B82F6',
    },
    {
        id: 'eats',
        subtitle: 'KőszegEats',
        title: 'A város ízei,\negy érintésre.',
        desc: 'Kőszeg legjobb ízei egy helyen. Foglalj asztalt, böngészd az étlapokat, vagy kérd kedvencedet egyenesen a szállásodra.',
        image: '/assets/showcase/eats.png',
        link: '/eats',
        accent: '#F97316',
    },
    {
        id: 'tickets',
        subtitle: 'Jegyvásárlás',
        title: 'Soha többé\nsorban állás.',
        desc: 'Vedd meg a jegyedet a múzeumokba vagy a Várszínházba pillanatok alatt. Csak mutasd fel a telefonodat, és már bent is vagy.',
        image: '/assets/showcase/ticket.png',
        link: '/tickets',
        accent: '#8B5CF6',
    },
    {
        id: 'map',
        subtitle: 'Élő térkép',
        title: 'Egy térkép,\nami veled lélegzik.',
        desc: 'Intelligens parkolási zónák, eső-detektálás, optimális útvonalak a látványosságok között. Soha ne tévedj el a városban.',
        image: '/assets/showcase/Realtime_map.png',
        link: '/live-map',
        accent: '#10B981',
    },
    {
        id: 'booking',
        subtitle: 'Időpontfoglaló',
        title: 'Foglalj időpontot\nbármire.',
        desc: 'Fodrász, kozmetikus, masszázs, orvos — kösd le az időpontod percek alatt. Azonnali visszaigazolás, automatikus emlékeztető.',
        image: '/assets/showcase/booking_fodrász.png',
        link: '/idopontfoglalas',
        accent: '#EC4899',
    },
    {
        id: 'reels',
        subtitle: 'KőszegReels',
        title: '24 óra múlva\neltűnik.',
        desc: 'Az igazi Kőszeg — hangulatok, pillanatok, helyszínek. Posztolj, nézz, élj. Minden pillanatkép 24 óra múlva örökre eltűnik.',
        image: '/assets/showcase/koszegreels.png',
        link: '/moments',
        accent: '#06B6D4',
    },
    {
        id: 'quest',
        subtitle: '1532 · Kőszeg Quest',
        title: 'Titkok, amiket\ncsak a falak tudnak.',
        desc: 'A város, mint egy játéktér. Keress elrejtett nyomokat a macskaköves utcákon, és keltsd életre a történelmet AR-ben!',
        image: '/assets/showcase/koszeggame_for_turists.png',
        link: '/game/intro',
        accent: '#F59E0B',
    },
];

// ─── SCROLL CONTAINER DETECTION ──────────────────────────────────────────────

function useScrollContainer(rootRef) {
    const [container, setContainer] = useState(null);
    useEffect(() => {
        const t = setTimeout(() => {
            let el = rootRef.current;
            while (el && el !== document.body) {
                const cs = window.getComputedStyle(el);
                if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
                    setContainer(el);
                    return;
                }
                el = el.parentElement;
            }
            setContainer(window);
        }, 100);
        return () => clearTimeout(t);
    }, []);
    return container;
}

// ─── HERO WORD ────────────────────────────────────────────────────────────────

const HeroWord = ({ children, delay = 0, dim = false }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0, y: 30, filter: 'blur(20px)', scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay }}
            className={`inline-block ${dim ? 'text-white/20' : ''}`}
        >
            {children}
        </motion.span>
    );
};

// ─── FEATURE TEXT SLIDE ───────────────────────────────────────────────────────

const FeatureText = ({ feat, scrollYProgress, index, total }) => {
    const s = index / total;
    const e = (index + 1) / total;
    const p = 0.05; // 5% fade zone
    
    const opacity = useTransform(scrollYProgress, [s, s + p, e - p, e], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [s, s + p, e - p, e], [30, 0, 0, -30]);
    const filter = useTransform(scrollYProgress, [s, s + p, e - p, e], ['blur(15px)', 'blur(0px)', 'blur(0px)', 'blur(15px)']);
    
    // BUGFIX: Prevent overlapping invisible links from intercepting clicks!
    const pointerEvents = useTransform(opacity, (val) => val > 0.5 ? 'auto' : 'none');

    return (
        <motion.div
            style={{ opacity, y, filter, pointerEvents }}
            className="absolute inset-0 flex flex-col justify-center"
        >
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-6" style={{ color: feat.accent }}>
                {feat.subtitle}
            </p>
            <h2 className="text-[3rem] md:text-[4.5rem] lg:text-[5.5rem] font-black tracking-tighter leading-[0.88] mb-8 text-white whitespace-pre-line">
                {feat.title}
            </h2>
            <p className="text-lg md:text-xl text-white/50 font-medium leading-relaxed mb-10 max-w-sm">
                {feat.desc}
            </p>
            <Link
                to={feat.link}
                className="self-start inline-flex items-center gap-3 rounded-full px-7 py-3 font-bold text-sm text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-black/50"
                style={{ backgroundColor: feat.accent }}
            >
                Megnézem →
            </Link>
        </motion.div>
    );
};

// ─── FEATURE IMAGE SLIDE ──────────────────────────────────────────────────────

const FeatureImage = ({ feat, scrollYProgress, index, total }) => {
    const s = index / total;
    const e = (index + 1) / total;
    const p = 0.06;

    const opacity = useTransform(scrollYProgress, [s, s + p, e - p, e], [0, 1, 1, 0]);
    const filter = useTransform(scrollYProgress, [s, s + p, e - p, e], ['blur(20px)', 'blur(0px)', 'blur(0px)', 'blur(20px)']);
    
    // Subtle entry/exit scale only, NO continuous rotation
    const scale = useTransform(scrollYProgress, [s, s + p, e - p, e], [0.96, 1, 1, 0.96]);
    
    const glowOpacity = useTransform(scrollYProgress, [s, s + p, e - p, e], [0, 0.35, 0.35, 0]);

    return (
        <motion.div
            style={{ opacity, filter }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
            <motion.div
                style={{ opacity: glowOpacity, scale, backgroundColor: feat.accent }}
                className="absolute w-80 h-80 rounded-full blur-[100px] mix-blend-screen"
            />
            <motion.img
                src={feat.image}
                alt={feat.subtitle}
                style={{ scale }}
                className="relative max-h-[90%] max-w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
        </motion.div>
    );
};

// ─── PROGRESS DOT ─────────────────────────────────────────────────────────────

const ProgressDot = ({ scrollYProgress, index, total, accent }) => {
    const s = index / total;
    const e = (index + 1) / total;
    const p = 0.05;
    
    const opacity = useTransform(
        scrollYProgress,
        [Math.max(0, s - p), s + p, e - p, Math.min(1, e + p)],
        [0.15, 1, 1, 0.15]
    );
    const scale = useTransform(
        scrollYProgress,
        [Math.max(0, s - p), s + p, e - p, Math.min(1, e + p)],
        [1, 1.6, 1.6, 1]
    );
    const filter = useTransform(
        scrollYProgress,
        [Math.max(0, s - p), s + p, e - p, Math.min(1, e + p)],
        ['blur(0px)', 'blur(2px)', 'blur(2px)', 'blur(0px)']
    );

    return (
        <motion.div
            style={{ opacity, scale, filter, backgroundColor: accent }}
            className="w-[4px] h-[4px] rounded-full shadow-[0_0_10px_currentColor]"
        />
    );
};

// ─── BACKGROUND ACCENT ────────────────────────────────────────────────────────

const BgAccent = ({ scrollYProgress, index, total, accent }) => {
    const s = index / total;
    const e = (index + 1) / total;
    const p = 0.1;
    const opacity = useTransform(scrollYProgress, [s, s + p, e - p, e], [0, 0.08, 0.08, 0]);
    
    return (
        <motion.div
            style={{ 
                opacity, 
                background: `radial-gradient(circle at 75% 50%, ${accent} 0%, transparent 65%)` 
            }}
            className="absolute inset-0 pointer-events-none mix-blend-screen"
        />
    );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function FeatureShowcase() {
    const rootRef = useRef(null);
    const scrollContainer = useScrollContainer(rootRef);

    if (!scrollContainer) {
        return <div ref={rootRef} className="min-h-[200vh] bg-black" />;
    }

    const containerOpt = scrollContainer !== window ? { container: { current: scrollContainer } } : {};

    return <FeatureShowcaseInner containerOpt={containerOpt} />;
}

function FeatureShowcaseInner({ containerOpt }) {
    const sectionRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end end'],
        ...containerOpt,
    });

    const { scrollYProgress: pageProgress } = useScroll(containerOpt);

    const heroOpacity = useTransform(pageProgress, [0, 0.05], [1, 0]);
    const heroScale = useTransform(pageProgress, [0, 0.05], [1, 0.9]);
    const heroFilter = useTransform(pageProgress, [0, 0.05], ['blur(0px)', 'blur(20px)']);

    return (
        <div className="bg-[#030303] text-white font-sans selection:bg-white selection:text-black">

            <SEO
                title="VisitKőszeg – A szuperapp bemutatója"
                description="Fedezd fel a VisitKőszeg összes funkcióját: KőszegEats, jegyvásárlás, élő térkép, időpontfoglaló, KőszegReels és Kőszeg Quest — Kőszeg digitális szuperappja."
                url="/showcase"
                keywords="VisitKőszeg funkciók, Kőszeg app bemutató, KőszegEats, Kőszeg Quest, KőszegReels"
            />

            {/* Top progress line */}
            <motion.div
                style={{ scaleX: pageProgress, transformOrigin: 'left center' }}
                className="fixed top-0 left-0 right-0 h-[2px] bg-white/30 z-[100]"
            />

            {/* Back button */}
            <Link
                to="/"
                className="fixed top-6 left-6 z-[100] w-12 h-12 flex items-center justify-center
                           rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1]
                           hover:bg-white/[0.15] hover:scale-110 active:scale-95 transition-all text-white shadow-2xl"
            >
                <IoArrowBack size={18} />
            </Link>

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale, filter: heroFilter }}
                className="h-screen sticky top-0 z-10 flex flex-col items-center justify-center
                           text-center px-6 pointer-events-none overflow-hidden"
            >
                {/* Ambient background orbs (Static for cleaner look) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
                </div>

                {/* Eyebrow */}
                <div className="text-[11px] font-black uppercase tracking-[0.5em] mb-12 space-x-3">
                    <HeroWord delay={0.1}>Visit</HeroWord>
                    <HeroWord delay={0.2}>Kőszeg</HeroWord>
                    <span className="opacity-20">·</span>
                    <HeroWord delay={0.3} dim>A</HeroWord>
                    <HeroWord delay={0.4} dim>Jövő</HeroWord>
                </div>

                {/* Main headline */}
                <h1 className="text-[4.5rem] md:text-[8rem] lg:text-[11rem] font-black tracking-tighter leading-[0.85]">
                    <div><HeroWord delay={0.3}>Kőszeg.</HeroWord></div>
                    <div>
                        <HeroWord delay={0.5} dim>Minden&nbsp;</HeroWord>
                        <HeroWord delay={0.65} dim>eddiginél</HeroWord>
                    </div>
                    <div><HeroWord delay={0.8}>közelebb.</HeroWord></div>
                </h1>

                {/* Scroll cue */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1.5 }}
                    className="mt-20 flex flex-col items-center gap-[8px]"
                >
                    <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black mb-4">
                        Fedezd fel
                    </p>
                    <motion.div
                        animate={{ opacity: [0.1, 0.8, 0.1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-px h-12 bg-gradient-to-b from-white to-transparent"
                    />
                </motion.div>
            </motion.section>

            {/* ── SCROLLTELLING ─────────────────────────────────────────────── */}
            <div
                ref={sectionRef}
                style={{ height: `${FEATURES.length * 200}vh` }}
                className="relative z-20"
            >
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    {/* Per-feature background color shift */}
                    <div className="absolute inset-0 transition-opacity duration-1000">
                        {FEATURES.map((feat, i) => (
                            <BgAccent
                                key={feat.id}
                                scrollYProgress={scrollYProgress}
                                index={i}
                                total={FEATURES.length}
                                accent={feat.accent}
                            />
                        ))}
                    </div>

                    {/* Content layout */}
                    <div className="relative h-full flex items-center justify-center">
                        <div className="w-full max-w-7xl h-full flex flex-col md:flex-row items-center px-6 md:px-16 pt-20 pb-10">

                            {/* Left: text slides */}
                            <div className="w-full md:w-[45%] h-[40%] md:h-full relative z-30">
                                {FEATURES.map((feat, i) => (
                                    <FeatureText
                                        key={feat.id}
                                        feat={feat}
                                        scrollYProgress={scrollYProgress}
                                        index={i}
                                        total={FEATURES.length}
                                    />
                                ))}
                            </div>

                            {/* Right: image slides */}
                            <div className="w-full md:w-[55%] h-[60%] md:h-[85vh] relative z-20">
                                {FEATURES.map((feat, i) => (
                                    <FeatureImage
                                        key={feat.id}
                                        feat={feat}
                                        scrollYProgress={scrollYProgress}
                                        index={i}
                                        total={FEATURES.length}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right-side progress dots */}
                        <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
                            {FEATURES.map((feat, i) => (
                                <ProgressDot
                                    key={feat.id}
                                    scrollYProgress={scrollYProgress}
                                    index={i}
                                    total={FEATURES.length}
                                    accent={feat.accent}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <section className="relative z-30 min-h-screen flex flex-col items-center justify-center
                                text-center px-6 bg-[#030303] border-t border-white/[0.03] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-indigo-500/15 blur-[180px]" />
                </div>

                <motion.p
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[12px] font-black uppercase tracking-[0.5em] text-white/30 mb-10"
                >
                    Minden készen áll
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 40, filter: 'blur(15px)', scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="text-[4.5rem] md:text-[7rem] lg:text-[9rem] font-black tracking-tighter leading-[0.85] mb-16 text-white"
                >
                    A város<br />vár rád.
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                >
                    <Link
                        to="/"
                        className="group relative inline-flex items-center gap-5 bg-white text-black rounded-full
                                   px-12 py-6 font-black tracking-tight text-2xl
                                   hover:scale-105 active:scale-95 transition-all duration-400 shadow-[0_0_80px_rgba(255,255,255,0.2)] hover:shadow-[0_0_100px_rgba(255,255,255,0.4)]"
                    >
                        <span className="relative z-10">Alkalmazás indítása</span>
                        <span className="relative z-10 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center
                                         group-hover:translate-x-2 transition-transform duration-300">
                            →
                        </span>
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-30 py-12 text-center text-white/20 text-[11px] font-black
                                tracking-[0.4em] uppercase border-t border-white/[0.03] bg-[#030303]">
                VisitKőszeg · 2026 · Minden jog fenntartva
            </footer>

        </div>
    );
}
