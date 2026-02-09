import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const screens = [
  {
    img: "/images/about_pictures/dash.jpg",
    title: "A Város Központja",
    desc: "Hírek, időjárás, ügyintézés. A digitális irányítópult, ami összefogja Kőszeg mindennapjait."
  },
  {
    img: "/images/about_pictures/events.jpg",
    title: "Élő Kultúra",
    desc: "Koncertek, kiállítások, rendezvények. A város programjai valós időben."
  },
  {
    img: "/images/about_pictures/game.jpg",
    title: "Felfedezés",
    desc: "Játék és történelem. A múlt interaktív élménnyé válik."
  },
  {
    img: "/images/about_pictures/eats.jpg",
    title: "Helyi Gasztronómia",
    desc: "Étteremrendelés és asztalfoglalás. A pénz a városban marad."
  },
  {
    img: "/images/about_pictures/pass.jpg",
    title: "KőszegPass",
    desc: "Hűség, kedvezmény, közösség. Több mint egy digitális kártya."
  },
  {
    img: "/images/about_pictures/helyi.jpg",
    title: "Helyieknek",
    desc: "Hulladéknaptár, információk, értesítések. A város szolgál."
  },
  {
    img: "/images/about_pictures/tickets.jpg",
    title: "Digitális Belépés",
    desc: "City Pass, QR, Wallet integráció. Sorban állás nélkül."
  }
];

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

  return (
    <div ref={containerRef} className="bg-black text-white overflow-x-hidden">

      {/* BACK BUTTON */}
      <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <button
          onClick={() => navigate("/info")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
        >
          <IoArrowBack />
        </button>
      </div>

      {/* HERO */}
      <section className="h-screen flex items-center justify-center">
        <motion.h1
          style={{
            opacity: useTransform(smooth, [0, 0.1], [1, 0])
          }}
          className="text-[12vw] font-bold tracking-tight"
        >
          KŐSZEG.
        </motion.h1>
      </section>

      {/* FEATURE SECTIONS */}
      {screens.map((screen, index) => (
        <section
          key={index}
          className="h-screen flex items-center justify-center relative"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.img
              src={screen.img}
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{
                scale: useTransform(
                  smooth,
                  [index / screens.length, (index + 1) / screens.length],
                  [1.1, 1]
                ),
                opacity: useTransform(
                  smooth,
                  [index / screens.length, (index + 0.1) / screens.length],
                  [0, 1]
                )
              }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <div className="relative text-center max-w-3xl px-6">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              {screen.title}
            </h2>
            <p className="text-xl text-neutral-300 leading-relaxed">
              {screen.desc}
            </p>
          </div>
        </section>
      ))}

      {/* STATEMENT */}
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

      {/* FINALE */}
      <section className="h-screen flex items-center justify-center bg-black">
        <h1 className="text-[10vw] font-bold tracking-tight">
          Ez még csak a kezdet.
        </h1>
      </section>

    </div>
  );
}
