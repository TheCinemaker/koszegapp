import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const sections = [
  {
    img: "/images/about_pictures/dash.jpg",
    title: "A Város Rendszere",
    text: `Kőszeg többé nem csak utcák és terek összessége.
Egy élő digitális struktúra.
Valós idejű információ.
Intelligens koordináció.
A város lüktetése most már mérhető.
És elérhető.`,
  },
  {
    img: "/images/about_pictures/events.jpg",
    title: "A Város, ami Történik",
    text: `A kultúra nem plakátokon él.
Hanem pillanatokban.
Koncertek.
Fesztiválok.
Találkozások.
A KőszegAPP nem listáz.
Összekapcsol.`,
  },
  {
    img: "/images/about_pictures/eats.jpg",
    title: "A Pénz Itthon Marad",
    text: `Nem külső platform.
Nem jutalékrendszer.
Egy városi ökoszisztéma.
Ahol a rendelés nem csak étel.
Hanem döntés.`,
  },
  {
    img: "/images/about_pictures/pass.jpg",
    title: "Több, mint Kártya",
    text: `A KőszegPass nem kedvezmény.
Hanem identitás.
Lakos vagy.
Része vagy.
Számítasz.`,
  },
  {
    img: "/images/about_pictures/helyi.jpg",
    title: "A Város, ami Szól Hozzád",
    text: `Hulladéknaptár.
Értesítések.
Forgalom.
Információ.
Nem kell keresned a várost.
A város megtalál téged.`,
  },
  {
    img: "/images/about_pictures/tickets.jpg",
    title: "Belépés. Újragondolva.",
    text: `Nincs papír.
Nincs sor.
Nincs elveszett e-mail.
Csak egy mozdulat.
És a város megnyílik.`,
  },
  {
    img: "/images/about_pictures/game.jpg",
    title: "A Múlt, ami Él",
    text: `A történelem nem könyv.
Hanem élmény.
Rejtvény.
Felfedezés.
A város története újra mesélhető.`,
  },
];

export default function AboutDetail() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20,
  });

  return (
    <div
      ref={containerRef}
      className="bg-black text-white overflow-x-hidden selection:bg-white/30"
    >

      {/* FILM GRAIN */}
      <div className="fixed inset-0 z-[999] pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* SCROLL PROGRESS */}
      <motion.div
        className="fixed top-0 left-0 h-[2px] bg-white z-50 origin-left"
        style={{ scaleX: smooth }}
      />

      {/* BACK BUTTON */}
      <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <button
          onClick={() => navigate("/info")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center"
        >
          <IoArrowBack />
        </button>
      </div>

      {/* HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9, y: 60 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-[20vw] leading-none font-black tracking-[-0.06em]"
        >
          KŐSZEG
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-12 text-2xl md:text-4xl text-neutral-400 font-light max-w-3xl"
        >
          Egy város. Új identitással.
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

      {/* SILENCE SECTION */}
      <section className="h-screen flex items-center justify-center bg-black text-center px-6">
        <h2 className="text-4xl md:text-6xl text-neutral-400 font-medium tracking-tight">
          Nem követjük a jövőt.
        </h2>
      </section>

      {/* CLIMAX */}
      <section className="h-[180vh] bg-black flex items-center justify-center relative">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl text-neutral-500 mb-16"
          >
            Ez nem egy alkalmazás.
          </motion.h2>

          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-[12vw] leading-[0.9] font-black tracking-[-0.04em]"
          >
            Ez Kőszeg új identitása.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12 text-xl md:text-2xl text-neutral-500"
          >
            Digitálisan újragondolva.
          </motion.p>
        </div>
      </section>

      {/* FINALE */}
      <section className="h-screen flex items-center justify-center text-center px-6 bg-black">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
          className="text-[8vw] font-bold tracking-tight"
        >
          Ez még csak a kezdet.
        </motion.h2>
      </section>

    </div>
  );
}

function MonumentalSection({ img, title, text }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const opacity = useTransform(
    scrollYProgress,
    [0.15, 0.3, 0.7, 0.85],
    [0, 1, 1, 0]
  );

  return (
    <section ref={ref} className="relative min-h-[170vh] bg-black">

      {/* IMAGE (z-0) */}
      <div className="sticky top-0 h-screen overflow-hidden z-0">
        <motion.img
          src={img}
          alt={title}
          style={{ scale, y }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* TEXT (z-10) */}
      <div className="absolute inset-0 flex items-center justify-center text-center px-6 pointer-events-none z-10">
        <motion.div style={{ opacity }} className="max-w-4xl">
          <h3 className="text-6xl md:text-[8vw] font-black tracking-tight mb-10 drop-shadow-2xl text-white">
            {title}
          </h3>
          <p className="text-xl md:text-3xl text-neutral-200 leading-relaxed whitespace-pre-line drop-shadow-lg">
            {text}
          </p>
        </motion.div>
      </div>

    </section>
  );
}
