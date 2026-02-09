import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

export default function AboutDetail() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001
  });

  // Hero Text Transform
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 15]); // Explodes into the viewer
  const heroOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);
  const heroBlur = useTransform(smoothProgress, [0, 0.1], ["0px", "20px"]);

  return (
    <div ref={containerRef} className="bg-black text-white selection:bg-white/30 overflow-x-hidden">

      {/* GLOBAL BACK BUTTON (Fixed) */}
      <div className="fixed top-6 left-6 z-[100] mix-blend-difference">
        <button
          onClick={() => navigate("/info")}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
        >
          <IoArrowBack className="text-xl text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 1. CINEMATIC HERO */}
      <section className="h-screen sticky top-0 flex items-center justify-center overflow-hidden z-0">
        <motion.div style={{ scale: heroScale, opacity: heroOpacity, filter: heroBlur }} className="z-10">
          <h1 className="text-[22vw] leading-none font-black tracking-tighter text-white select-none">
            KŐSZEG
          </h1>
        </motion.div>

        {/* Background Video/Image Placeholder - Fades in as text explodes */}
        <motion.div
          style={{ opacity: useTransform(smoothProgress, [0.05, 0.2], [0, 0.6]) }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
          <img src="/images/about_pictures/dash.jpg" alt="Hero BG" className="w-full h-full object-cover opacity-50" />
        </motion.div>
      </section>

      {/* Spacer to allow hero scroll effect to play out */}
      <div className="h-[50vh]" />


      {/* 2. MANIFESTO (Floating up) */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true, margin: "-10%" }}
            className="text-4xl md:text-7xl font-bold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
          >
            A város, ami a kezedben él.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-12 text-xl md:text-3xl text-neutral-400 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Nem csak egy térkép. Nem csak egy naptár. A KőszegAPP a fizikai és digitális világ fúziója.
          </motion.p>
        </div>
      </section>


      {/* 3. IMMERSIVE SHOWCASES (Full Width Parallax) */}
      <ShowcaseSection
        img="/images/about_pictures/events.jpg"
        title="Kultúra"
        subtitle="Élőben, azonnal."
        desc="Koncertek, kiállítások, fesztiválok. Minden program egy helyen."
        align="left"
      />

      <ShowcaseSection
        img="/images/about_pictures/eats.jpg"
        title="Gasztronómia"
        subtitle="Ízek határok nélkül."
        desc="A legjobb éttermek, kávézók és borászatok. Foglalj asztalt egy érintéssel."
        align="right"
      />


      {/* 4. BENTO GRID (Features) */}
      <section className="relative z-10 py-40 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-bold mb-16 text-white"
          >
            Mindenre gondoltunk.
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">

            {/* LARGE CARD: Map/Discovery */}
            <BentoCard className="md:col-span-2 relative group overflow-hidden">
              <div className="absolute inset-0 bg-[url('/images/about_pictures/game.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <h4 className="text-3xl font-bold mb-2">Interaktív Térkép</h4>
                <p className="text-neutral-400 text-lg">Fedezd fel a kincseket. Játékosított városnézés.</p>
              </div>
            </BentoCard>

            {/* TALL CARD: Pass */}
            <BentoCard className="md:row-span-2 relative group overflow-hidden bg-zinc-900 border border-white/5">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                <img src="/images/about_pictures/pass.jpg" className="w-[120%] max-w-none rotate-12" alt="Pass" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
              <div className="absolute bottom-8 left-8 right-8">
                <h4 className="text-3xl font-bold mb-2">KőszegPass</h4>
                <p className="text-neutral-400">A kulcs a városhoz. Kedvezmények, belépők, identitás.</p>
              </div>
            </BentoCard>

            {/* MEDIUM CARD: Weather/Info */}
            <BentoCard className="relative group overflow-hidden bg-indigo-900/20 border border-indigo-500/20">
              <div className="absolute top-8 left-8">
                <h4 className="text-2xl font-bold text-indigo-300">Intelligens Város</h4>
              </div>
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-neutral-300">Parkolás, Időjárás, Ügyintézés. Valós idejű adatok.</p>
              </div>
              {/* Abstract graphic */}
              <div className="absolute top-1/2 right-4 w-32 h-32 bg-indigo-500/30 blur-[40px] rounded-full" />
            </BentoCard>

            {/* MEDIUM CARD: Tickets */}
            <BentoCard className="relative group overflow-hidden bg-zinc-900 border border-white/5">
              <div className="absolute inset-0 bg-[url('/images/about_pictures/tickets.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="absolute bottom-8 left-8 right-8">
                <h4 className="text-2xl font-bold mb-1">Jegyvásárlás</h4>
                <p className="text-neutral-400">Sorban állás nélkül.</p>
              </div>
            </BentoCard>

          </div>
        </div>
      </section>

      {/* 5. FUTURE / OUTRO */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center relative z-10 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute w-[60vw] h-[60vw] bg-white/5 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative z-10 text-center"
        >
          <h2 className="text-[8vw] font-bold tracking-tighter leading-none mb-6">
            JÖVŐ
          </h2>
          <div className="h-px w-32 bg-white/30 mx-auto mb-10" />
          <p className="text-xl text-neutral-400 mb-12">Kőszeg 2.0. Elérhető most.</p>
        </motion.div>
      </section>

    </div>
  );
}

// --- SUBCOMPONENTS ---

function ShowcaseSection({ img, title, subtitle, desc, align = "left" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax effect for image
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="h-[120vh] relative overflow-hidden flex items-center">
      {/* BACKGROUND IMAGE WITH PARALLAX */}
      <motion.div style={{ y }} className="absolute inset-0 h-[140%] -top-[20%]">
        <img src={img} alt={title} className="w-full h-full object-cover brightness-[0.4]" />
      </motion.div>

      {/* CONTENT */}
      <motion.div
        style={{ opacity }}
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 ${align === "right" ? "direction-rtl" : ""}`}
      >
        <div className={`${align === "right" ? "md:col-start-2 text-right" : "md:col-start-1 text-left"}`}>
          <h3 className="text-xl font-bold text-indigo-400 uppercase tracking-widest mb-4">{title}</h3>
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-[0.9]">{subtitle}</h2>
          <p className="text-xl md:text-2xl text-neutral-300 leading-relaxed font-light">{desc}</p>
        </div>
      </motion.div>
    </section>
  )
}

function BentoCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`rounded-[2rem] p-8 ${className}`}
    >
      {children}
    </motion.div>
  )
}
