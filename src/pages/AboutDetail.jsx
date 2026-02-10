import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const sections = [
  {
    img: "/images/about_pictures/dash.jpg",
    title: "A Város Rendszere",
    text: [
      "Kőszeg többé nem csak utcák és terek összessége.",
      "Egy élő digitális struktúra.",
      "Valós idejű információ.",
      "Intelligens koordináció.",
      "A város lüktetése most már mérhető.",
      "És bárki számára elérhető."
    ],
  },
  {
    img: "/images/about_pictures/events.jpg",
    title: "A Város, ami Történik",
    text: [
      "A kultúra nem plakátokon él.",
      "Hanem megismételhetetlen pillanatokban.",
      "Koncertek. Fesztiválok. Találkozások.",
      "A KőszegAPP nem csak listáz.",
      "Hanem valódi közösséget épít.",
      "És összekapcsol minket."
    ],
  },
  {
    img: "/images/about_pictures/eats.jpg",
    title: "A Pénz Itthon Marad",
    text: [
      "Nem egy külső multinacionális platform.",
      "Nem egy idegen jutalékrendszer.",
      "Ez egy zárt városi ökoszisztéma.",
      "Ahol a rendelés nem csak étel.",
      "Hanem egy tudatos döntés a helyi gazdaság mellett."
    ],
  },
  {
    img: "/images/about_pictures/pass.jpg",
    title: "Több, mint Kártya",
    text: [
      "A KőszegPass nem csak egy kedvezmény.",
      "Hanem a kőszegi identitás digitális jele.",
      "Lakos vagy. Itt élsz.",
      "Számítasz ennek a közösségnek.",
      "És most már a kezedben van a kulcs hozzá."
    ],
  },
  {
    img: "/images/about_pictures/helyi.jpg",
    title: "A Város, ami Szól Hozzád",
    text: [
      "Hulladéknaptár. Értesítések. Forgalom.",
      "Információ, amikor szükséged van rá.",
      "Nem neked kell keresned a várost.",
      "A város talál meg téged.",
      "Pontosan akkor, amikor kell."
    ],
  },
  {
    img: "/images/about_pictures/tickets.jpg",
    title: "Belépés. Újragondolva.",
    text: [
      "Nincs több papír.",
      "Nincs sorban állás.",
      "Nincs elveszett visszaigazoló e-mail.",
      "Csak egyetlen mozdulat a telefonoddal.",
      "És Kőszeg kapui megnyílnak előtted."
    ],
  },
  {
    img: "/images/about_pictures/game.jpg",
    title: "A Múlt, ami Él",
    text: [
      "A történelem nem egy poros könyv.",
      "Hanem egy interaktív élmény.",
      "Rejtvények. Titkok. Felfedezés.",
      "A város története újra mesélhető.",
      "És te vagy a főszereplője."
    ],
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
      className="bg-black text-white overflow-x-hidden selection:bg-white/30 font-sans"
    >

      {/* FILM GRAIN & NOISE */}
      <div className="fixed inset-0 z-[999] pointer-events-none opacity-[0.06] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* PROGRESS BAR */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-white z-[1000] origin-left mix-blend-difference"
        style={{ scaleX: smooth }}
      />

      {/* BACK BUTTON */}
      <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <button
          onClick={() => navigate("/info")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 group"
        >
          <IoArrowBack className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      {/* HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9, y: 100, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-[18vw] md:text-[20vw] leading-none font-black tracking-[-0.07em] select-none mix-blend-overlay"
        >
          KŐSZEG
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12 overflow-hidden"
        >
          <p className="text-2xl md:text-4xl text-neutral-400 font-light max-w-3xl tracking-wide">
            Egy város. Új identitással.
          </p>
        </motion.div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-50 animate-bounce">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      </section>

      {/* STORY SECTIONS */}
      {sections.map((section, index) => (
        <MonumentalSection
          key={index}
          img={section.img}
          title={section.title}
          textLines={section.text}
        />
      ))}

      {/* SILENCE SECTION */}
      <section className="h-[80vh] flex items-center justify-center bg-black text-center px-6 z-10 relative">
        <RevealText text="Nem követjük a jövőt." className="text-4xl md:text-7xl text-neutral-400 font-medium tracking-tight" />
      </section>

      {/* CLIMAX */}
      <section className="h-[200vh] bg-black flex items-center justify-center relative z-10">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 w-full">
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-5xl text-neutral-500 font-light tracking-wide">Ez nem egy alkalmazás.</h2>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="text-[12vw] leading-[0.8] font-black tracking-[-0.05em] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-700"
          >
            Ez Kőszeg<br />új identitása.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 text-xl md:text-3xl text-neutral-400"
          >
            Digitálisan újragondolva.
          </motion.p>
        </div>
      </section>

      {/* FINALE */}
      <section className="h-screen flex items-center justify-center text-center px-6 bg-black z-10 relative">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="text-[8vw] font-bold tracking-tight text-white"
        >
          Ez még csak a kezdet.
        </motion.h2>
      </section>

    </div>
  );
}

function MonumentalSection({ img, title, textLines }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax & Scale
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  // Opacity allows text to be readable
  const opacity = useTransform(
    scrollYProgress,
    [0.2, 0.35, 0.65, 0.8],
    [0, 1, 1, 0]
  );

  // Blur effect for transitions
  const blur = useTransform(
    scrollYProgress,
    [0.2, 0.35, 0.65, 0.8],
    ["10px", "0px", "0px", "10px"]
  );

  return (
    <section ref={ref} className="relative min-h-[160vh] bg-black">

      {/* IMAGE (z-0) */}
      <div className="sticky top-0 h-screen overflow-hidden z-0">
        <motion.img
          src={img}
          alt={title}
          style={{ scale, y }}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        {/* Stronger Gradient for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>

      {/* TEXT (z-10) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-10">
        <motion.div style={{ opacity, filter: blur }} className="max-w-5xl">
          <h3 className="text-5xl md:text-[7vw] font-black tracking-[-0.04em] mb-12 drop-shadow-2xl text-white leading-[0.9]">
            {title}
          </h3>
          <div className="space-y-4">
            {textLines.map((line, i) => (
              <p key={i} className="text-xl md:text-4xl text-neutral-100 leading-snug font-light drop-shadow-lg tracking-wide">
                {line}
              </p>
            ))}
          </div>
        </motion.div>
      </div>

    </section>
  );
}

function RevealText({ text, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  return (
    <h2 ref={ref} className={className}>
      {text}
    </h2>
  );
}
