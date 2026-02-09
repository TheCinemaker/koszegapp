import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from "react-icons/io5";

export default function AboutDetail() {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
  });

  // -----------------------------
  // 3D TILT (SPRING)
  // -----------------------------
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const isFinePointer =
      window.matchMedia &&
      window.matchMedia("(pointer: fine)").matches;

    if (!isFinePointer) return;

    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [prefersReducedMotion]);

  const rotateX = useSpring(-mouse.y, { stiffness: 120, damping: 25 });
  const rotateY = useSpring(mouse.x, { stiffness: 120, damping: 25 });

  // -----------------------------
  // BACKGROUND MORPH
  // -----------------------------
  const bgColor = useTransform(
    smooth,
    [0, 0.3, 0.6, 1],
    ["#000000", "#0a0a15", "#101225", "#000000"]
  );

  // -----------------------------
  // DEVICE SCALE
  // -----------------------------
  const deviceScale = useTransform(smooth, [0, 0.3], [0.9, 1.08]);

  // -----------------------------
  // LIGHT SWEEP
  // -----------------------------
  const lightSweepX = useTransform(smooth, [0.2, 0.6], ["-120%", "120%"]);

  // -----------------------------
  // SCREEN SEQUENCE
  // -----------------------------
  const screens = [
    "dash.jpg",
    "events.jpg",
    "eats.jpg",
    "game.jpg",
    "helyi.jpg",
    "pass.jpg",
    "tickets.jpg",
  ];

  const screenOpacities = screens.map((_, i) =>
    useTransform(
      smooth,
      [0.25 + i * 0.08, 0.45 + i * 0.08],
      [1, 0]
    )
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-hidden bg-black text-white"
      style={{ perspective: "1800px" }}
    >
      {/* BACKGROUND */}
      <motion.div
        className="fixed inset-0 -z-20"
        style={{ backgroundColor: bgColor }}
      >
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </motion.div>

      {/* Floating Header / Back Button (Restored) */}
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
        className="fixed top-0 left-0 h-[2px] bg-white z-50 origin-left"
        style={{ scaleX: smooth }}
      />

      {/* CINEMATIC SECTION */}
      <section className="h-[500vh] relative">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

          {/* SOFT GLOW BEHIND DEVICE */}
          <motion.div
            style={{ scale: deviceScale }}
            className="absolute w-[600px] h-[600px] bg-indigo-700/20 rounded-full blur-[160px]"
          />

          {/* DEVICE CONTAINER */}
          <motion.div
            style={{
              rotateX,
              rotateY,
              scale: deviceScale,
              transformStyle: "preserve-3d",
            }}
            className="relative w-[380px] h-[780px] flex items-center justify-center"
          >
            {/* SCREEN CONTENT */}
            <div className="absolute w-[330px] h-[710px] overflow-hidden rounded-[40px]">
              {screens.map((screen, i) => (
                <motion.img
                  key={screen}
                  src={`/images/about_pictures/${screen}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: screenOpacities[i] }}
                  alt=""
                />
              ))}

              {/* GLASS LIGHT SWEEP */}
              <motion.div
                style={{ x: lightSweepX }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12"
              />
            </div>

            <img
              src="/images/about_pictures/iphone-frame.png"
              alt="iPhone Frame"
              className="absolute w-full h-full object-contain pointer-events-none select-none z-10"
              draggable="false"
              onError={(e) => e.target.style.display = 'none'} // Hide if missing
            />
          </motion.div>

          {/* HERO TEXT */}
          <motion.h1
            style={{
              opacity: useTransform(smooth, [0, 0.2], [1, 0]),
              scale: useTransform(smooth, [0, 0.2], [1, 1.2]),
            }}
            className="absolute text-[10vw] font-bold tracking-tight text-white"
          >
            KŐSZEG.
          </motion.h1>
        </div>
      </section>

      {/* SILENT APPLE SECTION */}
      <section className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-[6vw] font-bold tracking-tight">
            Nem egy alkalmazás.
          </h2>
          <h2 className="text-[6vw] font-bold tracking-tight mt-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
            Egy digitális város.
          </h2>
        </div>
      </section>

      {/* FINAL IMPACT */}
      <section className="h-screen flex items-center justify-center relative bg-black overflow-hidden">
        <div
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.05), #000 60%)",
          }}
          className="absolute inset-0"
        />
        <motion.h1
          style={{
            scale: useTransform(smooth, [0.9, 1], [1, 1.4]),
          }}
          className="relative text-[10vw] font-bold tracking-tight text-center"
        >
          Ez még csak a kezdet.
        </motion.h1>
      </section>
    </div>
  );
}
