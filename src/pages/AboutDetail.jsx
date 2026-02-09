import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoChevronDown } from "react-icons/io5";

const screens = [
  { id: "dash", img: "/images/about_pictures/dash.jpg", title: "Városirányítás", desc: "Minden fontos információ egy helyen. Időjárás, hírek, és gyorselérés a legfontosabb funkciókhoz." },
  { id: "events", img: "/images/about_pictures/events.jpg", title: "Események", desc: "Soha ne maradj le semmiről. Koncertek, kiállítások, városi programok valós időben." },
  { id: "eats", img: "/images/about_pictures/eats.jpg", title: "Gasztronómia", desc: "A legjobb éttermek és kávézók zsebre vágva. Fedezd fel Kőszeg ízeit." },
  { id: "game", img: "/images/about_pictures/game.jpg", title: "Kincskeresés", desc: "Fedezd fel a várost játékkosítva. Gyűjts gyémántokat és teljesíts küldetéseket." },
  { id: "helyi", img: "/images/about_pictures/helyi.jpg", title: "Helyieknek", desc: "Exkluzív tartalmak és közösségi funkciók a kőszegiek számára." },
  { id: "pass", img: "/images/about_pictures/pass.jpg", title: "KőszegPass", desc: "Digitális városkártya. Kedvezmények, belépők és identitás egy helyen." },
  { id: "tickets", img: "/images/about_pictures/tickets.jpg", title: "Jegyvásárlás", desc: "Vedd meg a jegyed előre, sorban állás nélkül. Egyszerű, gyors, biztonságos." },
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

  // Transform scroll progress to screen index
  // We map the total scroll range (0 to 1) to the number of screens
  const currentScreenIndex = useTransform(smoothProgress, [0, 1], [0, screens.length - 1]);

  return (
    <div ref={containerRef} className="relative bg-black text-white selection:bg-indigo-500/30">

      {/* GLOBAL NOISE TEXTURE */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* HEADER / BACK BUTTON */}
      <div className="fixed top-6 left-6 z-[60] mix-blend-difference">
        <button
          onClick={() => navigate('/info')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all font-bold text-white shadow-2xl"
        >
          <IoArrowBack className="text-xl group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* INTRO HERO SECTION */}
      <section className="h-screen flex flex-col items-center justify-center relative sticky top-0 bg-black z-10">
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]), scale: useTransform(scrollYProgress, [0, 0.1], [1, 0.8]) }}
          className="text-center z-10 px-4"
        >
          <h1 className="text-[12vw] sm:text-[15vw] font-bold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-700">
            KŐSZEG
          </h1>
          <p className="text-xl sm:text-2xl text-neutral-400 mt-4 font-medium tracking-wide">
            A jövő városa a kezedben.
          </p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-500"
          >
            <IoChevronDown className="text-3xl" />
          </motion.div>
        </motion.div>

        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-black to-black pointer-events-none" />
      </section>

      {/* STICKY PHONE SHOWCASE SECTION */}
      {/* Height is roughly number of screens * 100vh to allow scrolling */}
      <div className="relative" style={{ height: `${screens.length * 100}vh` }}>

        {/* STICKY CONTAINER */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

          {/* PHONE CONTAINER */}
          <div className="relative w-[300px] sm:w-[350px] md:w-[400px] aspect-[9/19.5] transition-transform duration-700">

            {/* AMBIENT GLOW BEHIND PHONE */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-indigo-600/30 blur-[100px] rounded-full opacity-50 animate-pulse-slow"></div>

            {/* IPHONE FRAME */}
            <img
              src="/images/about_pictures/iphone-frame.png"
              alt="iPhone Frame"
              className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none drop-shadow-2xl"
            />

            {/* SCREEN CONTENT */}
            <div className="absolute inset-[3%] top-[2.5%] bottom-[2.5%] rounded-[40px] overflow-hidden bg-black z-10">
              {screens.map((screen, index) => (
                <motion.div
                  key={screen.id}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    opacity: useTransform(
                      smoothProgress,
                      // Calculate active range for this screen
                      // e.g., if 7 screens, range is 0..1. Each screen takes 1/7 chunk with some overlap
                      [(index - 0.5) / screens.length, index / screens.length, (index + 0.5) / screens.length],
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
                  {/* Glass Reflection Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none mix-blend-overlay"></div>
                </motion.div>
              ))}
            </div>

          </div>

          {/* FLOATING TEXT OVERLAY (Synced with screens) */}
          <div className="absolute bottom-10 sm:bottom-20 left-0 right-0 z-30 px-6 text-center">
            {screens.map((screen, index) => (
              <motion.div
                key={`text-${screen.id}`}
                className="absolute left-0 right-0"
                style={{
                  opacity: useTransform(
                    smoothProgress,
                    [(index - 0.3) / screens.length, index / screens.length, (index + 0.3) / screens.length],
                    [0, 1, 0]
                  ),
                  y: useTransform(
                    smoothProgress,
                    [(index - 0.3) / screens.length, index / screens.length, (index + 0.3) / screens.length],
                    [50, 0, -50]
                  ),
                  pointerEvents: "none"
                }}
              >
                <h2 className="text-3xl sm:text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-lg">
                  {screen.title}
                </h2>
                <p className="text-lg sm:text-xl text-neutral-300 max-w-lg mx-auto leading-relaxed drop-shadow-md">
                  {screen.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* OUTRO SECTION */}
      <section className="h-screen flex items-center justify-center bg-black relative z-10">
        <div className="text-center px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-7xl font-bold tracking-tight mb-8"
          >
            Nem csak egy app.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl sm:text-3xl text-neutral-400 font-light"
          >
            Egy digitális ökoszisztéma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Csatlakozz most
            </button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
