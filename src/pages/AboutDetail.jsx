import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoChevronDown } from "react-icons/io5";

// Reduced list of key screens to tell a tighter story
const screens = [
  {
    id: "dash",
    img: "/images/about_pictures/dash.jpg",
    title: "Városirányítás",
    desc: "Minden, ami Kőszeg. Hírek, időjárás és ügyintézés egyetlen felületen. A város lüktetése a zsebedben."
  },
  {
    id: "events",
    img: "/images/about_pictures/events.jpg",
    title: "Élmények",
    desc: "A kultúra otthona. Koncertek, fesztiválok, kiállítások. Ne maradj le a pillanatról."
  },
  {
    id: "pass",
    img: "/images/about_pictures/pass.jpg",
    title: "Közösség",
    desc: "Több mint lakcímkártya. A KőszegPass a belépőd a kedvezmények és a helyi identitás világába."
  },
];

export default function AboutDetail() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map scroll to screen index
  const currentScreenIndex = useTransform(smoothProgress, [0.2, 0.8], [0, screens.length - 1]);

  return (
    <div ref={containerRef} className="relative bg-black text-white selection:bg-indigo-500/30">

      {/* GLOBAL NOISE TEXTURE */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* HEADER / BACK BUTTON */}
      <div className="fixed top-6 left-6 z-[60] mix-blend-difference">
        <button
          onClick={() => navigate('/info')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all font-bold text-white shadow-2xl"
        >
          <IoArrowBack className="text-xl group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 1. HERO SECTION (Static height) */}
      <section className="h-screen flex flex-col items-center justify-center relative bg-black z-10">
        <motion.div
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]),
            scale: useTransform(scrollYProgress, [0, 0.15], [1, 0.9]),
            y: useTransform(scrollYProgress, [0, 0.15], [0, -50])
          }}
          className="text-center z-10 px-6 max-w-4xl"
        >
          <h1 className="text-[12vw] sm:text-[10vw] font-bold tracking-tighter leading-none text-white mb-6">
            KŐSZEG
          </h1>
          <p className="text-xl sm:text-3xl text-neutral-300 font-light leading-relaxed">
            Nem egy alkalmazás. <br />
            <span className="text-indigo-400 font-semibold">Egy digitális város.</span>
          </p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-500"
        >
          <IoChevronDown className="text-3xl" />
        </motion.div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* 2. MANIFESTO SECTION (Scrolls normally) */}
      <section className="min-h-[60vh] flex items-center justify-center py-20 bg-black relative z-20">
        <div className="max-w-2xl px-8 text-center">
          <p className="text-2xl sm:text-4xl font-medium leading-snug text-neutral-200">
            "A célunk nem az, hogy a telefonodat nyomkodd. A célunk az, hogy <span className="text-white border-b-2 border-indigo-500">jobban éld meg a várost.</span>"
          </p>
          <p className="mt-8 text-lg text-neutral-400 leading-relaxed">
            A KőszegAPP a város digitális szövete. Összeköti a történelmet a jövővel, a lakókat a lehetőségekkel. Offline térképek, valós idejű közlekedés, intelligens turizmus. Minden egy helyen, ami Kőszeg.
          </p>
        </div>
      </section>


      {/* 3. STICKY PHONE SHOWCASE (Reduced height: 250vh total) */}
      <div className="relative" style={{ height: "250vh" }}>

        <div className="sticky top-0 h-screen flex flex-col md:flex-row items-center justify-center overflow-hidden">

          {/* LEFT: DYNAMIC TEXT */}
          <div className="md:w-1/2 px-8 z-30 flex flex-col items-center md:items-end text-center md:text-right mb-10 md:mb-0">
            {screens.map((screen, index) => (
              <motion.div
                key={`text-${screen.id}`}
                className="absolute md:relative md:h-screen flex flex-col justify-center"
                style={{
                  opacity: useTransform(
                    smoothProgress,
                    [(index * 0.25) + 0.1, (index * 0.25) + 0.25, (index * 0.25) + 0.4],
                    [0, 1, 0]
                  ),
                  // Mobile: Absolute positioning tweak
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute'
                }}
              >
                <h2 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight text-white">
                  {screen.title}
                </h2>
                <p className="text-lg sm:text-xl text-neutral-400 max-w-sm leading-relaxed">
                  {screen.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* RIGHT: PHONE */}
          <div className="md:w-1/2 flex justify-center md:justify-start relative">
            <div className="relative w-[280px] sm:w-[320px] aspect-[9/19.5] transition-transform duration-700">

              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[100%] bg-blue-600/20 blur-[80px] rounded-full"></div>

              {/* Frame */}
              <img
                src="/images/about_pictures/iphone-frame.png"
                alt="iPhone Frame"
                className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none drop-shadow-2xl"
              />

              {/* Screens */}
              <div className="absolute inset-[3%] top-[2.5%] bottom-[2.5%] rounded-[36px] overflow-hidden bg-black z-10">
                {screens.map((screen, index) => (
                  <motion.div
                    key={screen.id}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      opacity: useTransform(
                        smoothProgress,
                        // Broader opacity range to ensure visibility
                        [(index * 0.25), (index * 0.25) + 0.15, (index * 0.25) + 0.35],
                        [0, 1, 0]
                      ),
                      zIndex: index
                    }}
                  >
                    <img
                      src={screen.img}
                      alt={screen.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. OUTRO / DOWNLOAD */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-950 relative z-10 py-20 pb-40">
        <div className="text-center px-4 max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-8xl font-bold tracking-tight mb-8 text-white"
          >
            Indulhatunk?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl text-zinc-400 font-light mb-12"
          >
            A KőszegAPP ingyenes és reklámmentes. Mert a város közös.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {/* Buttons removed by request */}
          </motion.div>

          <div className="mt-20 opacity-30 invert">
            <img src="/images/koeszeg_logo_nobg.png" className="w-16 h-16 mx-auto grayscale" alt="Logo" />
          </div>
        </div>
      </section>

    </div>
  );
}
