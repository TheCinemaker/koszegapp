import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoArrowBack, IoHeart, IoCodeSlash, IoDiamond,
  IoSunny, IoMap, IoLogoFacebook, IoRocket, IoFingerPrint, IoServer, IoHardwareChip, IoInfinite, IoEye, IoWater
} from 'react-icons/io5';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// --- COMPONENTS FOR APPLE-STYLE SCROLLING ---

const FadeUp = ({ children, delay = 0, duration = 1.8 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80, filter: 'blur(15px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: duration, ease: [0.16, 1, 0.3, 1], delay: delay }}
    >
      {children}
    </motion.div>
  );
};

const ParallaxImage = ({ src, className, speed = 1 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${20 * speed}%`, `${20 * speed}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        style={{ y }}
        src={src}
        alt=""
        className="w-full h-full object-cover scale-125 feature-img"
      />
    </div>
  );
};

// Brighter Gradient Text Reveal (start opaque sooner)
const GradientRevealText = ({ children, className }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.4"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);

  return (
    <motion.p ref={ref} style={{ opacity }} className={className}>
      {children}
    </motion.p>
  );
}


export default function AboutDetail() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const bgOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.92]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <div className="bg-[#000000] text-[#f5f5f7] font-sans antialiased overflow-x-hidden selection:bg-purple-500 selection:text-white pb-32">

      {/* GLOBAL ATMOSPHERE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-black" />
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-900/15 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/15 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>

      {/* --- FLOATING NAV --- */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate('/info')}
          className="group flex items-center justify-center w-14 h-14 rounded-full bg-[#1c1c1e]/40 backdrop-blur-xl border border-white/10 hover:bg-[#2c2c2e] hover:scale-105 active:scale-95 transition-all duration-500 shadow-2xl"
        >
          <IoArrowBack className="text-2xl text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <main className="relative z-10 text-center md:text-left">

        {/* --- [SECTION 1] HERO --- */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden pt-20">
          <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="text-center w-full max-w-[90rem] relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="mb-12 flex justify-center"
            >
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-gray-400 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md bg-white/5">
                Designed by SA Software
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(50px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[14vw] sm:text-[180px] leading-[0.9] font-bold tracking-tighter text-white mb-8 drop-shadow-2xl"
            >
              Kőszeg<span className="text-gray-600">APP</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.8 }}
              className="text-2xl md:text-5xl font-medium text-gray-300 max-w-4xl mx-auto tracking-tight leading-tight"
            >
              Az egyetlen alkalmazás,<br />
              amire Kőszegen szükséged van.
            </motion.p>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
        </section>


        {/* --- [SECTION 2] THE ORIGIN STORY (EXPANDED) --- */}
        <section className="py-60 px-6">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-32 items-center">

            {/* Text Side */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <FadeUp>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                  <IoInfinite className="text-5xl text-purple-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400 mb-6 block text-center lg:text-left">The Origin Story</span>

                <h2 className="text-5xl md:text-7xl font-semibold tracking-tight mb-12 text-white leading-[1.05] text-center lg:text-left">
                  A lehetetlen<br />kódolása.
                </h2>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div className="space-y-12 text-xl md:text-2xl text-gray-300 font-medium leading-relaxed text-center lg:text-left">
                  <p>
                    Minden nagy utazás egyetlen lépéssel kezdődik. Vagy ebben az esetben: egyetlen sor kóddal. Amikor <b className="text-white">Avar Szilveszter</b>, az SA software and network solutions alapítója először álmodta meg ezt az alkalmazást, a cél nem csupán egy információs portál létrehozása volt.
                  </p>
                  <p>
                    Ez túlságosan egyszerű lett volna. A cél sokkal ambiciózusabb volt: létrehozni egy olyan digitális kísérőt, amely nem csak megmutatja a várost, hanem <i>meg is érti</i> azt.
                  </p>
                  <p>
                    Hónapokon át tartó fejlesztés, végtelen iterációk és a tökéletesség iránti megszállottság jellemezte a folyamatot. Nem alkalmaztunk kész sablonokat. Nem fogadtunk el kompromisszumokat. Minden egyes funkciót az alapoktól építettünk fel, hogy tökéletesen illeszkedjen Kőszeg egyedi lüktetéséhez.
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Visual Side */}
            <div className="lg:col-span-7 order-1 lg:order-2 h-[80vh] rounded-[3rem] overflow-hidden bg-[#0a0a0a] relative border border-white/10 shadow-[0_0_100px_-20px_rgba(100,0,255,0.2)]">
              <ParallaxImage
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop"
                className="w-full h-full opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
                speed={0.4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-10">
                <span className="text-[200px] font-black text-white/5 select-none leading-none">SA</span>
              </div>

              <div className="absolute bottom-12 left-12 right-12">
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-10 border border-white/10 flex flex-col md:flex-row items-center gap-8 max-w-xl mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shrink-0">
                    SA
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">VISIONARY ARCHITECT</span>
                    <span className="text-3xl font-bold text-white block mb-1">Avar Szilveszter</span>
                    <span className="text-sm font-mono text-purple-400 block tracking-[0.2em]">FOUNDER / DEVELOPER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* --- [SECTION 3] THE TECHNOLOGY (VERBOSITY MAX) --- */}
        <section className="py-60 bg-[#050505] relative overflow-hidden border-t border-white/5">
          <div className="absolute top-[30%] right-[-20%] w-[100vw] h-[100vw] bg-blue-900/10 rounded-full blur-[200px] pointer-events-none" />

          <div className="max-w-[90vw] mx-auto mb-60 relative z-10 text-center lg:text-left lg:px-20">
            <FadeUp>
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-blue-500 mb-8 block">Processzor a városnak</span>
              <h2 className="text-7xl md:text-9xl lg:text-[140px] font-semibold tracking-tighter text-white mb-16 leading-[0.9]">
                Intelligencia.<br />
                Minden pixelen.
              </h2>
            </FadeUp>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <GradientRevealText className="text-2xl md:text-4xl font-medium leading-tight text-gray-400">
                Amikor megnyitod az alkalmazást, nem csak letöltesz pár adatot. Egy elosztott, felhőalapú architektúrához csatlakozol, amelyet a <span className="text-white">Supabase</span> valós idejű adatbázis-technológiája hajt.
              </GradientRevealText>
              <GradientRevealText className="text-2xl md:text-4xl font-medium leading-tight text-gray-400">
                Ez azt jelenti, hogy ha egy étterem módosítja az árait, vagy ha az időjárás egyetlen fokot is változik, a telefonod kijelzője még azelőtt frissül, hogy pislognál. Ez nem varázslat. Ez mérnöki pontosság.
              </GradientRevealText>
            </div>
          </div>

          {/* Feature Showcase Grid (Renamed & Expanded) */}
          <div className="max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-6">

            {/* Feature 1: Weather */}
            <FadeUp delay={0}>
              <div className="relative aspect-[9/16] rounded-[3.5rem] overflow-hidden bg-[#0a0a0a] group border border-white/10 hover:border-yellow-500/30 transition-all duration-700 hover:shadow-[0_0_60px_-20px_rgba(255,200,0,0.2)]">
                <ParallaxImage src="https://images.unsplash.com/photo-1590055531575-3519701720d9?q=80&w=1000&auto=format&fit=crop" className="opacity-40 group-hover:opacity-60 transition-opacity duration-1000 grayscale group-hover:grayscale-0" />

                <div className="absolute top-12 left-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 inline-block">
                  <IoSunny className="text-5xl text-yellow-500" />
                </div>

                <div className="absolute bottom-12 left-10 right-10 z-20">
                  <h3 className="text-4xl font-bold text-white mb-6 tracking-tight">SkySense™ Időjárás</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    Nem elégedtünk meg a globális, pontatlan adatokkal. Rendszerünk közvetlenül <b>Ráduly László</b>, a helyi időjárás szaktekintélyének adatait integrálja.
                  </p>
                  <p className="text-gray-400 text-sm font-medium">
                    Napi jelentések • Helyi anomáliák • UV Index • Szélsebesség
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
              </div>
            </FadeUp>

            {/* Feature 2: Maps */}
            <FadeUp delay={0.2}>
              <div className="relative aspect-[9/16] rounded-[3.5rem] overflow-hidden bg-[#0a0a0a] group border border-white/10 hover:border-blue-500/30 transition-all duration-700 hover:shadow-[0_0_60px_-20px_rgba(0,100,255,0.2)]">
                <ParallaxImage src="https://images.unsplash.com/photo-1478860409698-8707f313ee8b?q=80&w=1000&auto=format&fit=crop" className="opacity-40 group-hover:opacity-60 transition-opacity duration-1000 grayscale group-hover:grayscale-0" />

                <div className="absolute top-12 left-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 inline-block">
                  <IoMap className="text-5xl text-blue-500" />
                </div>

                <div className="absolute bottom-12 left-10 right-10 z-20">
                  <h3 className="text-4xl font-bold text-white mb-6 tracking-tight">Liquid Navigation</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    Felejtsd el a papírtérképeket. A Live Map motorunk egy interaktív, 60fps sebességgel renderelt vászon. Minden étterem, minden múzeum, minden parkoló egyetlen érintéssel elérhető.
                  </p>
                  <p className="text-gray-400 text-sm font-medium">
                    Valós idejű szűrés • Távolságkövetés • Útvonaltervezés
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
              </div>
            </FadeUp>

            {/* Feature 3: Design */}
            <FadeUp delay={0.4}>
              <div className="relative aspect-[9/16] rounded-[3.5rem] overflow-hidden bg-[#0a0a0a] group border border-white/10 hover:border-pink-500/30 transition-all duration-700 hover:shadow-[0_0_60px_-20px_rgba(255,0,150,0.2)]">
                <ParallaxImage src="https://images.unsplash.com/photo-1558655146-d09347e0b7a9?q=80&w=1000&auto=format&fit=crop" className="opacity-50 group-hover:opacity-60 transition-opacity duration-1000 grayscale group-hover:grayscale-0" />

                <div className="absolute top-12 left-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 inline-block">
                  <IoEye className="text-5xl text-pink-500" />
                </div>

                <div className="absolute bottom-12 left-10 right-10 z-20">
                  <h3 className="text-4xl font-bold text-white mb-6 tracking-tight">Retina-Ready UI</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    A felszínt <b className="text-white">Hidalmási Erik</b> formálta meg. Ez nem csak design. Ez a "Liquid Glass" filozófia manifesztációja.
                  </p>
                  <p className="text-gray-400 text-sm font-medium">
                    Blur effektusok • Mélységélesség • Mikro-animációk
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
              </div>
            </FadeUp>

          </div>
        </section>


        {/* --- [SECTION 4] PHILOSOPHY OF CRAFT --- */}
        <section className="py-60 px-6 max-w-[100rem] mx-auto flex flex-col items-center">
          <FadeUp>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-8 block text-center">Craftsmanship</span>
            <h2 className="text-6xl md:text-9xl font-semibold tracking-tighter text-white mb-20 text-center">
              Részletek.<br />Amik számítanak.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-20 w-full">
            <FadeUp delay={0.1}>
              <div className="space-y-8">
                <IoWater className="text-6xl text-cyan-400 mb-8" />
                <h3 className="text-3xl font-bold text-white">Folyékony mozgás.</h3>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Egy alkalmazásnak nem csak működnie kell. Érződnie kell.
                  Ezért használunk fizikailag szimulált rugókat (spring physics) minden egyes animációhoz.
                  Amikor megérintesz egy gombot, az nem csak "kattan". Hanem reagál a nyomásra,
                  majd természetes rugalmassággal tér vissza.
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="space-y-8">
                <IoDiamond className="text-6xl text-white mb-8" />
                <h3 className="text-3xl font-bold text-white">Kristálytiszta struktúra.</h3>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Az információ hatalom, de csak akkor, ha átlátható.
                  Több száz órát töltöttünk a tipográfiai hierarchia finomhangolásával.
                  Minden betűköz, minden sormagasság mérnöki pontossággal lett kiszámítva,
                  hogy a szemed fáradtság nélkül falhassa az információt.
                </p>
              </div>
            </FadeUp>
          </div>
        </section>


        {/* --- [SECTION 5] TECH SPECS (Grid) --- */}
        <section className="py-20 px-6 border-y border-white/5 bg-[#080808]">
          <div className="max-w-7xl mx-auto">
            <FadeUp>
              <h3 className="text-2xl font-bold text-white mb-12">Technical Specifications</h3>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-gray-500 font-mono text-sm">
              <FadeUp delay={0.1}>
                <ul className="space-y-4">
                  <li className="text-white font-bold border-b border-white/10 pb-2 mb-4">Core Framework</li>
                  <li>React 18.2.0</li>
                  <li>Vite 5.0 Bundle Engine</li>
                  <li>Strict Mode Enabled</li>
                  <li>Concurrent Rendering</li>
                </ul>
              </FadeUp>
              <FadeUp delay={0.2}>
                <ul className="space-y-4">
                  <li className="text-white font-bold border-b border-white/10 pb-2 mb-4">Visual Engine</li>
                  <li>TailwindCSS 3.4</li>
                  <li>Framer Motion 10</li>
                  <li>Hardware Acceleration</li>
                  <li>Sub-pixel Antialiasing</li>
                </ul>
              </FadeUp>
              <FadeUp delay={0.3}>
                <ul className="space-y-4">
                  <li className="text-white font-bold border-b border-white/10 pb-2 mb-4">Data Layer</li>
                  <li>Supabase Realtime</li>
                  <li>PostgreSQL 15</li>
                  <li>Edge Caching</li>
                  <li>Instant Sync</li>
                </ul>
              </FadeUp>
              <FadeUp delay={0.4}>
                <ul className="space-y-4">
                  <li className="text-white font-bold border-b border-white/10 pb-2 mb-4">Compatibility</li>
                  <li>iOS 16+ Optimized</li>
                  <li>Android Adaptive</li>
                  <li>PWA Capable</li>
                  <li>Dark Mode Native</li>
                </ul>
              </FadeUp>
            </div>
          </div>
        </section>


        {/* --- [SECTION 6] FINAL CALL TO ACTION --- */}
        <section className="min-h-screen flex flex-col items-center justify-center relative bg-black">
          <div className="text-center z-10 px-6 max-w-5xl mx-auto">
            <FadeUp>
              <IoRocket className="text-[120px] text-white/5 mx-auto mb-16 animate-pulse-slow" />
              <h2 className="text-6xl md:text-[100px] font-bold text-white mb-12 tracking-tighter leading-none">
                A város.<br />
                A jövő.
              </h2>
            </FadeUp>

            <FadeUp delay={0.3}>
              <p className="text-3xl text-gray-400 mb-20 max-w-2xl mx-auto font-medium leading-relaxed">
                Ez a KőszegAPP. Több mint egy alkalmazás. <br />A város digitális lelke.
              </p>

              <button
                onClick={() => navigate('/')}
                className="
                            group relative overflow-hidden
                            bg-white text-black 
                            px-20 py-8 rounded-full 
                            font-bold text-2xl tracking-wide
                            transition-all duration-300 hover:scale-105 hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.4)]
                        "
              >
                <span className="relative z-10">Belépés</span>
                <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <div className="mt-40 border-t border-white/10 pt-10 w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase mb-2">Developed by</p>
                    <div className="text-white font-bold tracking-widest uppercase text-lg">
                      SA SOFTWARE<br />
                      <span className="text-purple-500 text-sm">AVAR SZILVESZTER</span>
                    </div>
                  </div>

                  <div className="hidden md:block h-10 w-[1px] bg-white/20"></div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase mb-2">Designed by</p>
                    <div className="text-white font-bold tracking-widest uppercase text-lg">
                      HIDALMÁSI ERIK
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>
    </div>
  );
}
