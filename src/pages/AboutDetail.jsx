import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoArrowBack,
  IoRocket,
  IoSunny,
  IoMap,
  IoWater,
  IoDiamond,
  IoGlobeOutline,
  IoConstructOutline
} from 'react-icons/io5';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// --- COMPONENTS FOR APPLE-STYLE SCROLLING ---

/**
 * Standard Cinematic FadeUp
 * Slower duration default (1.5s) for that "heavy", premium feel.
 */
const FadeUp = ({ children, delay = 0, duration = 1.6, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
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
  const y = useTransform(scrollYProgress, [0, 1], [`-${15 * speed}%`, `${15 * speed}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        style={{ y }}
        src={src}
        alt=""
        className="w-full h-full object-cover scale-110"
      />
    </div>
  );
};

export default function AboutDetail() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const bgOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <div className="bg-[#000000] text-[#f5f5f7] font-sans antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white pb-32">

      {/* GLOBAL ATMOSPHERE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-black" />
        {/* Subtle Ambient Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[10%] left-[-20%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <span className="relative text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-300 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md bg-black/50">
                  The Ultimate City Experience
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(30px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[14vw] sm:text-[160px] leading-[0.85] font-bold tracking-tighter text-white mb-10 drop-shadow-2xl"
            >
              Kőszeg<span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">APP</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 0.8 }}
              className="text-2xl md:text-4xl font-medium text-gray-400 max-w-3xl mx-auto tracking-tight leading-snug"
            >
              Ahol a történelem találkozik<br />
              <span className="text-white">a digitális jövővel.</span>
            </motion.p>
          </motion.div>

          {/* Corrected Gradient Direction for smoother bottom blend */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
        </section>


        {/* --- [SECTION 2] FEATURES & EXPERIENCE --- */}
        <section className="py-40 px-6 max-w-[100rem] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <div className="relative">
              {/* Visual for City Life */}
              <FadeUp>
                <div className="aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 relative shadow-2xl">
                  {/* Image: Beautiful Kőszeg street or abstract city representation */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2064&auto=format&fit=crop')] bg-cover bg-center opacity-50 mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                  {/* Floating UI Elements Simulation */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 space-y-4">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/20"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-500/80 flex items-center justify-center text-white text-xl shadow-lg"><IoSunny /></div>
                      <div className="flex-1">
                        <div className="h-2 w-24 bg-white/40 rounded-full mb-2"></div>
                        <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                      </div>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center gap-4 translate-x-12 shadow-lg shadow-black/20"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-500/80 flex items-center justify-center text-white text-xl shadow-lg"><IoMap /></div>
                      <div className="flex-1">
                        <div className="h-2 w-32 bg-white/40 rounded-full mb-2"></div>
                        <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </FadeUp>
            </div>

            <div className="space-y-16">
              <FadeUp delay={0.2}>
                <span className="text-sm font-bold uppercase tracking-[0.3em] text-blue-500 mb-6 block">Élmény mindenkinek</span>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-tight mb-8">
                  Több, mint<br />
                  <span className="text-gray-500">útikönyv.</span>
                </h2>
                <div className="space-y-8 text-xl text-gray-400 leading-relaxed font-medium">
                  <p>
                    A KőszegApp nem egyszerűen felsorolja a látnivalókat. <b className="text-white">Érzi a város lüktetését.</b> Valós idejű adatokkal, interaktív térképekkel és személyre szabott ajánlókkal segít felfedezni az ékszerdoboz minden rejtett kincsét.
                  </p>
                  <p>
                    Legyen szó egy hirtelen jött zivatar előli menekülésről, a legközelebbi szabad parkoló megtalálásáról vagy az esti koncert programjáról – minden válasz ott lapul a zsebedben.
                  </p>
                </div>
              </FadeUp>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FadeUp delay={0.3}>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                    <IoGlobeOutline className="text-3xl text-indigo-400 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Parkolás Élőben</h3>
                    <p className="text-sm text-gray-500">
                      Ne körözz feleslegesen. Látod, hol van hely, még mielőtt odaérnél.
                    </p>
                  </div>
                </FadeUp>
                <FadeUp delay={0.4}>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                    <IoConstructOutline className="text-3xl text-emerald-400 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Offline Mód</h3>
                    <p className="text-sm text-gray-500">
                      Nincs térerő a hegyekben? Nem gond. A térkép és az infók internet nélkül is veled vannak.
                    </p>
                  </div>
                </FadeUp>
              </div>
            </div>

          </div>
        </section>


        {/* --- [SECTION 3] THE ORIGIN STORY --- */}
        <section className="py-40 px-6">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">

            {/* Visual Side */}
            <div className="lg:col-span-7 h-[85vh] rounded-[3rem] overflow-hidden bg-[#0a0a0a] relative border border-white/5 shadow-2xl order-last lg:order-first">
              <ParallaxImage
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop"
                className="w-full h-full opacity-60 block"
                speed={0.5}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-10 left-10 p-8 glass-panel rounded-3xl border border-white/10 backdrop-blur-xl bg-black/40 max-w-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">AS</div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-none">Avar Szilveszter</h4>
                    <span className="text-indigo-300 text-xs font-mono uppercase tracking-wider">Dreamer & Creator</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed italic">
                  "Nem egy újabb szoftvert akartam írni. Egy olyan társat akartam adni a turisták és a helyiek kezébe, ami méltó ehhez a gyönyörű városhoz."
                </p>
              </div>
            </div>

            {/* Text Side */}
            <div className="lg:col-span-5">
              <FadeUp>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px w-10 bg-purple-500"></div>
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">Passion Project</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-semibold tracking-tight mb-10 text-white leading-[1.1]">
                  Szívvel. Lélekkel.<br />Kóddal.
                </h2>
              </FadeUp>
              <div className="space-y-10 text-lg md:text-xl text-gray-400 font-medium leading-relaxed">
                <FadeUp delay={0.1}>
                  <p>
                    Ez az alkalmazás nem egy multinacionális cég futószalagján készült. Ez egy <b className="text-white">szerelemprojekt</b>. Minden pixelt, minden animációt és minden sort azért írtunk meg, hogy Kőszeg digitális élménye felérjen a történelmi belváros hangulatához.
                  </p>
                </FadeUp>
                <FadeUp delay={0.2}>
                  <p>
                    A célunk egyszerű volt: elfeledtetni veled, hogy egy gépet tartasz a kezedben. Az alkalmazás nem eszköz, hanem egy ablak a városra. Gyors, gyönyörű és láthatatlan.
                  </p>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>


        {/* --- [SECTION 4] TECH MEETS ART --- */}
        <section className="py-40 bg-[#050505] relative overflow-hidden border-t border-white/5">
          {/* Decorative Background */}
          <div className="absolute top-[20%] left-[-10%] w-[100vw] h-[100vw] bg-purple-900/5 rounded-full blur-[200px] pointer-events-none" />

          <div className="max-w-[90vw] mx-auto text-center lg:text-left lg:px-20 mb-32">
            <FadeUp>
              <h2 className="text-7xl md:text-[120px] font-bold tracking-tighter text-white mb-6 leading-[0.9]">
                Művészet.
              </h2>
              <p className="text-2xl text-gray-500 max-w-2xl font-medium">
                Amikor a mérnöki precizitás találkozik a designnal.
              </p>
            </FadeUp>
          </div>

          <div className="max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">

            {/* Card 1 */}
            <FadeUp delay={0.1}>
              <div className="aspect-[3/4] rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 p-10 flex flex-col justify-between hover:bg-[#111] transition-colors duration-500 group">
                <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <IoWater className="text-4xl text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">60 FPS Flow</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Nincs akadozás. Nincs várakozás. Az app úgy mozog, mint a folyadék. Fizikai rugók (spring physics) vezérelnek minden mozdulatot, hogy az élmény természetes legyen, ne digitális.
                  </p>
                </div>
              </div>
            </FadeUp>

            {/* Card 2 */}
            <FadeUp delay={0.2}>
              <div className="aspect-[3/4] rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 p-10 flex flex-col justify-between hover:bg-[#111] transition-colors duration-500 group">
                <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <IoDiamond className="text-4xl text-purple-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">Liquid Ház</h3>
                  <p className="text-gray-400 leading-relaxed">
                    A <b>Hidalmási Erik</b> által megálmodott design nem csak szép, hanem funkcionális. A "Liquid Glass" esztétika nem takarja ki a tartalmat, hanem keretbe foglalja azt.
                  </p>
                </div>
              </div>
            </FadeUp>

            {/* Card 3 */}
            <FadeUp delay={0.3}>
              <div className="aspect-[3/4] rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 p-10 flex flex-col justify-between hover:bg-[#111] transition-colors duration-500 group">
                <div className="w-16 h-16 rounded-full bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <IoRocket className="text-4xl text-orange-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">Azonnali Szinkron</h3>
                  <p className="text-gray-400 leading-relaxed">
                    A háttérben a Supabase Realtime motorja dolgozik, hogy ha valahol felszabadul egy parkolóhely, vagy változik egy program, Te azonnal tudd.
                  </p>
                </div>
              </div>
            </FadeUp>

          </div>
        </section>

        {/* --- [SECTION 5] CONTACT / CTA --- */}
        <section className="min-h-screen flex flex-col items-center justify-center relative bg-black border-t border-white/5">
          <div className="text-center z-10 px-6 max-w-5xl mx-auto">
            <FadeUp>
              <div className="mb-12 inline-block p-1 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10">
                <div className="px-6 py-2 rounded-full bg-black">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest">
                    Közösség & Jövő
                  </span>
                </div>
              </div>

              <h2 className="text-6xl md:text-[90px] font-bold text-white mb-12 tracking-tighter leading-none">
                Ez még csak<br />
                a kezdet.
              </h2>
            </FadeUp>

            <FadeUp delay={0.3}>
              <p className="text-2xl text-gray-400 mb-20 max-w-2xl mx-auto font-medium leading-relaxed">
                Folyamatosan fejlesztünk, és hallgatunk a visszajelzéseitekre. Ha van ötleted, vagy csak elmondanád a véleményed, írj nekünk!
              </p>


              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="mailto:koszegapp@gmail.com"
                  className="px-12 py-6 rounded-full bg-white text-black font-bold text-xl hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  Írj Nekünk
                </a>
                <button
                  onClick={() => navigate('/')}
                  className="px-12 py-6 rounded-full bg-[#1c1c1e] text-white border border-white/10 font-bold text-xl hover:bg-[#2c2c2e] transition-colors duration-300"
                >
                  Vissza a Főoldalra
                </button>
              </div>


              <div className="mt-40 pt-10 w-full border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 hover:opacity-100 transition-opacity duration-500">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase mb-2">Developed by</p>
                    <div className="text-white font-bold tracking-widest uppercase text-lg">
                      SA SOFTWARE
                    </div>
                  </div>

                  <div className="hidden md:block h-8 w-[1px] bg-white/20"></div>

                  <div className="text-center md:text-right">
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
