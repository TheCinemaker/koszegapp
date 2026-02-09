import React, { useEffect, useState, useRef } from "react";
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

  const smooth = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20
  });

  // --- 3D MOUSE TILT ---
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // --- BACKGROUND MORPH ---
  const bgColor = useTransform(
    smooth,
    [0, 0.25, 0.5, 0.75, 1],
    ["#000000", "#070712", "#101225", "#070712", "#000000"]
  );

  // --- DEVICE SCALE ---
  const deviceScale = useTransform(smooth, [0, 0.3], [0.9, 1.05]);

  // --- DEVICE SCENE OPACITY ---
  const scene1Opacity = useTransform(smooth, [0, 0.3], [1, 0]);
  const scene2Opacity = useTransform(smooth, [0.3, 0.6], [0, 1]);
  const scene3Opacity = useTransform(smooth, [0.6, 0.9], [0, 1]);

  // --- TEXT TRANSITIONS ---
  const text1Opacity = useTransform(smooth, [0, 0.2], [1, 0]);
  const text2Opacity = useTransform(smooth, [0.3, 0.5], [0, 1]);
  const text3Opacity = useTransform(smooth, [0.6, 0.8], [0, 1]);

  const screens = [
    "dash.jpg",
    "events.jpg",
    "eats.jpg",
    "game.jpg",
    "helyi.jpg",
    "pass.jpg",
    "tickets.jpg"
  ];

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-hidden min-h-[500vh]" // Ensure height for scrolling
      style={{ perspective: "1600px" }}
    >
      {/* BACKGROUND */}
      <motion.div
        className="fixed inset-0 -z-20"
        style={{ backgroundColor: bgColor }}
      />

      {/* Floating Header / Back Button */}
      <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <button
          onClick={() => navigate('/info')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all font-bold text-white shadow-2xl"
        >
          <IoArrowBack className="text-xl group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* SCROLL PROGRESS */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] bg-white/80 z-50 origin-left mix-blend-overlay"
        style={{ scaleX: smooth }}
      />

      {/* CINEMATIC SECTION */}
      <section className="relative">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

          {/* DEPTH BLOOM BACKGROUND */}
          <motion.div
            style={{ opacity: scene2Opacity }}
            className="absolute w-[120vw] h-[120vw] bg-indigo-900/20 rounded-full blur-[200px]"
          />

          {/* DEVICE SCENE 1 */}
          <motion.div
            style={{
              opacity: scene1Opacity,
              scale: deviceScale,
              rotateY: mouse.x,
              rotateX: -mouse.y,
              display: useTransform(scene1Opacity, opacity => opacity > 0 ? "block" : "none") // Optimization
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="absolute w-[340px] h-[700px] rounded-[48px] bg-black border-[8px] border-zinc-900 shadow-[0_80px_200px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            {/* Mock Status Bar */}
            <div className="absolute top-0 w-full h-8 bg-black z-20 flex justify-between px-6 items-center">
              <div className="text-[10px] text-white font-medium">9:41</div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                <div className="w-3.5 h-1.5 rounded-full bg-white"></div>
              </div>
            </div>
            <img
              src="/images/about_pictures/dash.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              alt="Dashboard"
              onError={(e) => e.target.style.backgroundColor = '#111'} // Fallback if image missing
            />
          </motion.div>

          {/* DEVICE SCENE 2 (CROSSFADE MULTI SCREENS) */}
          <motion.div
            style={{
              opacity: scene2Opacity,
              scale: deviceScale,
              rotateY: mouse.x,
              rotateX: -mouse.y,
              display: useTransform(scene2Opacity, opacity => opacity > 0 ? "block" : "none")
            }}
            // Note: removed spring usage here for rotate to keep it synced or use same spring
            className="absolute w-[340px] h-[700px] bg-black shadow-[0_80px_200px_rgba(0,0,0,0.9)] rounded-[48px] border-[8px] border-zinc-900 overflow-hidden"
          >
            {screens.map((screen, i) => (
              <motion.img
                key={screen}
                src={`/images/about_pictures/${screen}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: useTransform(
                    smooth,
                    [0.3 + i * 0.05, 0.35 + i * 0.05],
                    [1, 0]
                  ),
                  zIndex: screens.length - i
                }}
                onError={(e) => e.target.style.backgroundColor = '#222'}
              />
            ))}
          </motion.div>

          {/* DEVICE SCENE 3 */}
          <motion.div
            style={{
              opacity: scene3Opacity,
              scale: deviceScale,
              rotateY: mouse.x,
              rotateX: -mouse.y,
              display: useTransform(scene3Opacity, opacity => opacity > 0 ? "block" : "none")
            }}
            className="absolute w-[340px] h-[700px] rounded-[48px] bg-black border-[8px] border-zinc-900 shadow-[0_80px_200px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            <img
              src="/images/about_pictures/game.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              alt="Game"
              onError={(e) => e.target.style.backgroundColor = '#111'}
            />
          </motion.div>

          {/* TEXT OVERLAY */}
          <div className="absolute text-center pointer-events-none z-30">
            <motion.h2
              style={{ opacity: text1Opacity, y: useTransform(smooth, [0, 0.2], [0, -50]) }}
              className="text-[12vw] md:text-[8vw] font-bold tracking-tighter text-white mix-blend-overlay"
            >
              KŐSZEG.
            </motion.h2>

            <motion.h2
              style={{ opacity: text2Opacity, scale: useTransform(smooth, [0.3, 0.5], [0.8, 1]) }}
              className="text-[8vw] md:text-[5vw] font-bold tracking-tighter text-white drop-shadow-2xl"
            >
              Élmények.<br />Élőben.
            </motion.h2>

            <motion.div style={{ opacity: text3Opacity }}>
              <h2 className="text-[6vw] md:text-[4vw] font-bold tracking-tight text-white mb-4">
                A Város<br />Operációs Rendszere.
              </h2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL IMPACT SECTION */}
      <section className="h-screen flex flex-col items-center justify-center bg-black relative z-40">
        <motion.h1
          style={{
            scale: useTransform(smooth, [0.9, 1], [0.8, 1.2]),
            opacity: useTransform(smooth, [0.85, 1], [0, 1])
          }}
          className="text-[10vw] font-bold text-white tracking-tighter text-center leading-none"
        >
          Ez még csak<br />a kezdet.
        </motion.h1>
      </section>
    </div>
  );
}
