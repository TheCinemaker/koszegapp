import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoChevronForward } from 'react-icons/io5';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// --- APPLE-STYLE ANIMATION COMPONENTS ---

const FadeUp = ({ children, delay = 0, duration = 1.2, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px -5% 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration, ease: [0.25, 0.1, 0.25, 1], delay: delay }}
    >
      {children}
    </motion.div>
  );
};

const ParallaxImage = ({ src, className, speed = 0.3 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${10 * speed}%`, `${10 * speed}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        style={{ y }}
        src={src}
        alt=""
        className="w-full h-full object-cover scale-105"
      />
    </div>
  );
};

// Apple-style Bento Card
const BentoCard = ({ children, className = "", span = "col-span-1", delay = 0 }) => (
  <FadeUp delay={delay}>
    <div className={`${span} rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] overflow-hidden ${className}`}>
      {children}
    </div>
  </FadeUp>
);

export default function AboutDetail() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.15], [0, -60]);

  return (
    <div className="bg-black text-white font-sans antialiased overflow-x-hidden selection:bg-white selection:text-black">

      {/* --- GLOBAL NAV --- */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <button
          onClick={() => navigate('/info')}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors duration-300"
        >
          <IoArrowBack className="text-lg" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="text-sm font-semibold tracking-wide">About</span>
        <div className="w-16" /> {/* Spacer for balance */}
      </div>

      <main>

        {/* --- HERO --- */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 relative">
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="text-center max-w-5xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-8"
            >
              Kőszeg
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[12vw] sm:text-[140px] leading-[0.9] font-semibold tracking-tighter text-white mb-8"
            >
              The city,<br />
              <span className="text-white/30">reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1 }}
              className="text-xl md:text-2xl text-white/50 max-w-xl mx-auto font-medium leading-relaxed"
            >
              Discover Kőszeg through a lens built for the modern explorer.
            </motion.p>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </section>


        {/* --- BENTO GRID: EXPERIENCE --- */}
        <section className="py-32 px-6 max-w-[1400px] mx-auto">
          <FadeUp>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-4">Experience</p>
            <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-20 leading-[1.1]">
              More than<br />a guide.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[400px]">

            {/* Large Feature Card */}
            <BentoCard span="md:col-span-2 md:row-span-2" delay={0.1} className="relative group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2064&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-10">
                <h3 className="text-3xl md:text-4xl font-semibold text-white mb-3">Live. Breathe. Explore.</h3>
                <p className="text-white/50 text-lg max-w-md leading-relaxed">
                  Real-time insights, interactive maps, and personalized recommendations that feel like second nature.
                </p>
              </div>
            </BentoCard>

            {/* Parking Card */}
            <BentoCard delay={0.2} className="p-8 flex flex-col justify-between group hover:bg-[#252528] transition-colors duration-500">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Smart Parking</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  See available spots before you arrive. No circling. No stress.
                </p>
              </div>
            </BentoCard>

            {/* Offline Card */}
            <BentoCard delay={0.3} className="p-8 flex flex-col justify-between group hover:bg-[#252528] transition-colors duration-500">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Offline First</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Maps and info work without signal. The mountains won't stop you.
                </p>
              </div>
            </BentoCard>

          </div>
        </section>


        {/* --- FULL-WIDTH STORY SECTION --- */}
        <section className="py-32 relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center px-6">

            <div className="order-2 lg:order-1">
              <FadeUp>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-6">Origin</p>
                <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-white mb-10 leading-[1.1]">
                  Built with<br />purpose.
                </h2>
              </FadeUp>
              <FadeUp delay={0.15}>
                <p className="text-xl text-white/50 leading-relaxed mb-8">
                  This is not another app. It is a love letter to a city that deserves a digital experience as rich as its history.
                </p>
                <p className="text-xl text-white/50 leading-relaxed">
                  Every pixel, every animation, every line of code exists to make Kőszeg feel closer. Intuitive. Invisible.
                </p>
              </FadeUp>
            </div>

            <div className="order-1 lg:order-2 h-[70vh] rounded-[2.5rem] overflow-hidden relative">
              <ParallaxImage
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop"
                className="w-full h-full opacity-70"
                speed={0.4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10">
                <p className="text-white/70 text-sm italic leading-relaxed">
                  "I wanted to create something that feels less like software and more like a window into the city."
                </p>
                <p className="text-white/40 text-xs mt-3 font-medium">— Avar Szilveszter, Creator</p>
              </div>
            </div>

          </div>
        </section>


        {/* --- BENTO GRID: DESIGN --- */}
        <section className="py-32 px-6 max-w-[1400px] mx-auto">
          <FadeUp>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-4">Design</p>
            <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-20 leading-[1.1]">
              Crafted to<br />perfection.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[350px]">

            {/* Performance Card */}
            <BentoCard delay={0.1} className="p-10 flex flex-col justify-between group hover:bg-[#252528] transition-colors duration-500">
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-3">Silky Smooth</h3>
                <p className="text-white/40 leading-relaxed">
                  Spring physics power every interaction. No stutter. No lag. Just fluid motion.
                </p>
              </div>
            </BentoCard>

            {/* Visual Card - Large */}
            <BentoCard span="md:col-span-2" delay={0.2} className="relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
              <div className="relative h-full flex flex-col justify-end p-10">
                <h3 className="text-2xl font-semibold text-white mb-2">Liquid Glass</h3>
                <p className="text-white/40 max-w-sm">
                  An interface that frames content without hiding it. Transparency, depth, and light.
                </p>
              </div>
              {/* Decorative orb */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            </BentoCard>

            {/* Realtime Card */}
            <BentoCard span="md:col-span-3" delay={0.3} className="relative group overflow-hidden min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 via-transparent to-indigo-900/10" />
              <div className="relative h-full flex flex-col md:flex-row items-center justify-between p-10 gap-8">
                <div className="max-w-lg">
                  <h3 className="text-2xl font-semibold text-white mb-2">Always in Sync</h3>
                  <p className="text-white/40">
                    Events, parking, weather — everything updates in real time. You just explore.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-white/30 font-mono uppercase tracking-wider">Live</span>
                </div>
              </div>
            </BentoCard>

          </div>
        </section>


        {/* --- PARTNERS SECTION --- */}
        <section className="py-32 px-6 bg-[#0a0a0a]">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <div>
              <FadeUp>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-6">Partners</p>
                <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-white mb-10 leading-[1.1]">
                  Grow with<br />us.
                </h2>
                <p className="text-xl text-white/50 leading-relaxed mb-12 max-w-lg">
                  List your events in Kőszeg's digital hub. We handle ticketing. You focus on the experience.
                </p>
                <button
                  onClick={() => navigate('/partners')}
                  className="group inline-flex items-center gap-2 text-white font-medium text-lg hover:gap-4 transition-all duration-300"
                >
                  Learn more about partnering
                  <IoChevronForward className="text-sm group-hover:translate-x-1 transition-transform" />
                </button>
              </FadeUp>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <FadeUp delay={0.1}>
                <div className="aspect-square rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] p-8 flex flex-col justify-end">
                  <span className="text-4xl md:text-5xl font-semibold text-white mb-2">0 Ft</span>
                  <span className="text-xs text-white/30 uppercase tracking-wider">Setup fee</span>
                </div>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div className="aspect-square rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] p-8 flex flex-col justify-end">
                  <span className="text-4xl md:text-5xl font-semibold text-white mb-2">Any</span>
                  <span className="text-xs text-white/30 uppercase tracking-wider">Device</span>
                </div>
              </FadeUp>
              <FadeUp delay={0.3}>
                <div className="aspect-square rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] p-8 flex flex-col justify-end">
                  <span className="text-4xl md:text-5xl font-semibold text-white mb-2">100%</span>
                  <span className="text-xs text-white/30 uppercase tracking-wider">Digital</span>
                </div>
              </FadeUp>
              <FadeUp delay={0.4}>
                <div className="aspect-square rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] p-8 flex flex-col justify-end">
                  <span className="text-4xl md:text-5xl font-semibold text-white mb-2">Wallet</span>
                  <span className="text-xs text-white/30 uppercase tracking-wider">Ready</span>
                </div>
              </FadeUp>
            </div>

          </div>
        </section>


        {/* --- CTA / FOOTER --- */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
          <FadeUp>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40 mb-8">What's next</p>
            <h2 className="text-6xl md:text-8xl font-semibold tracking-tight text-white mb-8 leading-[1]">
              This is just<br />the beginning.
            </h2>
            <p className="text-xl text-white/40 max-w-lg mx-auto mb-16 leading-relaxed">
              We are constantly evolving. Have feedback or ideas? We would love to hear from you.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href="mailto:admin@visitkoszeg.hu"
                className="px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
              >
                Contact us
              </a>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 rounded-full bg-white/5 text-white border border-white/10 font-medium hover:bg-white/10 transition-colors"
              >
                Back to app
              </button>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="mt-32 pt-8 w-full max-w-[1400px] border-t border-white/[0.06]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white/20 text-xs">
                <div className="flex items-center gap-8">
                  <span>SA Software</span>
                  <span className="hidden md:inline">·</span>
                  <span>Designed by Hidalmási Erik</span>
                </div>
                <span>© 2026 VisitKőszeg. All rights reserved.</span>
              </div>
            </div>
          </FadeUp>
        </section>

      </main>
    </div>
  );
}