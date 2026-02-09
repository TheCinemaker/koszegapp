import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const sections = [
  {
    img: "/images/about_pictures/dash.jpg",
    title: "A Kezdet",
    text: "Egy egyszerű kérdésből született. Mi lenne, ha Kőszeg nem csak egy hely lenne – hanem egy élő digitális tér?"
  },
  {
    img: "/images/about_pictures/events.jpg",
    title: "Az Út",
    text: "Több ezer munkaóra. Szenvedély. Részletekbe menő precizitás. Nem egy projekt volt. Egy küldetés."
  },
  {
    img: "/images/about_pictures/pass.jpg",
    title: "A Jelen",
    text: "Városkártya. Programfüzet. Turisztikai rendszer. Közösségi platform. Egy ökoszisztéma."
  },
  {
    img: "/images/about_pictures/game.jpg",
    title: "A Jövő",
    text: "Ez még csak a kezdet. A város velünk együtt fejlődik."
  }
];

export default function AboutDetail() {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white overflow-x-hidden selection:bg-white/30">

      {/* BACK BUTTON */}
      <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <button
          onClick={() => navigate("/info")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
        >
          <IoArrowBack />
        </button>
      </div>

      {/* HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-[20vw] leading-none font-black tracking-[-0.06em]"
        >
          KŐSZEG
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 text-2xl md:text-4xl text-neutral-400 font-light max-w-2xl"
        >
          Egy digitális város.
        </motion.p>
      </section>

      {/* STORY SECTIONS */}
      {sections.map((section, index) => (
        <MonumentalSection
          key={index}
          img={section.img}
          title={section.title}
          text={section.text}
        />
      ))}

      {/* CLIMAX */}
      <section className="h-[180vh] bg-black flex items-center justify-center relative">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-3xl md:text-5xl text-neutral-500 mb-16"
          >
            Nem egy alkalmazás.
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-[12vw] leading-[0.9] font-black tracking-[-0.04em]"
          >
            A város digitális gerince.
          </motion.h2>
        </div>
      </section>

      {/* OUTRO */}
      <section className="h-screen flex items-center justify-center text-center px-6 bg-black">
        <h2 className="text-[8vw] font-bold tracking-tight">
          Ez még csak a kezdet.
        </h2>
      </section>

    </div>
  );
}

function MonumentalSection({ img, title, text }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]); // Subtle zoom
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]); // Parallax
  const opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]); // Fade in/out

  return (
    <section ref={ref} className="relative min-h-[160vh] bg-black">

      {/* STICKY FULLSCREEN IMAGE */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.img
          src={img}
          alt={title}
          style={{ scale, y }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Subtle cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* FLOATING TEXT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <motion.div style={{ opacity }} className="max-w-4xl">
          <h3 className="text-6xl md:text-[8vw] font-black tracking-tight mb-10 drop-shadow-2xl">
            {title}
          </h3>
          <p className="text-xl md:text-3xl text-neutral-200 leading-relaxed font-light drop-shadow-lg">
            {text}
          </p>
        </motion.div>
      </div>

    </section>
  );
}
