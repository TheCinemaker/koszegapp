import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutDetail() {
  return (
    <div className="max-w-3xl mx-auto my-10 p-8 relative bg-neutral-900/80 backdrop-blur-xl rounded-3xl 
      shadow-2xl border-4 border-transparent animate-border-rainbow overflow-hidden">
      
      {/* Futó neon border */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none 
        border-4 border-transparent 
        [background:linear-gradient(60deg,hotpink,cyan,blue,lime,hotpink)]
        bg-[length:300%_300%] animate-[gradientShift_6s_ease_infinite] 
        z-10 mix-blend-overlay opacity-70">
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent_0_2px_rgba(255,255,255,0.03)_3px)] 
        pointer-events-none z-20" />

      {/* Tartalom */}
      <div className="relative z-30">
        <div className="mb-6">
          <Link 
            to="/info"
            className="inline-block text-cyan-400 hover:text-pink-400 hover:underline transition duration-300
              drop-shadow-[0_0_6px_cyan]"
          >
            ← Vissza az információkhoz
          </Link>
        </div>

        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text 
          bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500
          drop-shadow-[0_0_12px_cyan] animate-pulse">
          KőszegAPP
        </h1>

        <p className="text-gray-200 mb-6 leading-relaxed text-lg drop-shadow-[0_0_4px_pink]">
          A <span className="text-pink-400 font-semibold">KőszegAPP</span> egy rajongásból született, mobilbarát webalkalmazás,
          amelynek célja, hogy a városba látogató turisták és a helyiek egy helyen, átlátható és modern formában
          találják meg Kőszeg legizgalmasabb pontjait, programjait, éttermeit és minden hasznos információt. Az alkalmazásba mesterséges intelligencia (AI) alapú chatsegéd is be van építve, amely barátságosan próbál válaszolni a várossal kapcsolatos kérdésekre. A rendszer még fejlődő fázisban van, ezért előfordulhat, hogy hibás vagy pontatlan választ ad – ha ilyet találsz, kérlek jelezd nekünk!
        </p>
        
        {/* --- ÚJ SZEKCIÓ: Jogi Nyilatkozat --- */}
        <div className="border-l-4 border-pink-500 pl-4 mb-8 text-sm italic text-gray-400">
          <h3 className="font-semibold text-pink-400 not-italic mb-2">Fontos tudnivaló</h3>
          A fejlesztés és a kód teljes mértékben magánforrásból, városi vagy önkormányzati anyagi és/vagy szellemi segítség nélkül készült. A <span className="font-semibold">KőszegAPP</span> egy magánszemély által létrehozott, nem üzleti célú, hobbi projekt. A "Kőszeg" név használata kizárólag a város iránti elköteleződésből történik. Az alkalmazásban szereplő információk a legjobb tudásunk szerint kerültek összegyűjtésre, ugyanakkor nem minősülnek hivatalos tájékoztatásnak. Kérjük, minden fontos adatot (pl. nyitvatartás, árak) ellenőrizz közvetlenül az adott szolgáltatónál!
        </div>

        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Hogyan használd?</h2>
        <ul className="list-disc list-inside text-gray-200 mb-8 space-y-2">
          <li>Nyisd meg a <strong className="text-cyan-300">visitkoszeg.hu</strong> oldalt a mobilod böngészőjében.</li>
          <li>A böngésző menüjében (általában 3 pötty vagy megosztás ikon) koppints a <strong className="text-cyan-300">„Hozzáadás a főképernyőhöz”</strong> opcióra.</li>
          <li>Ezután az app ikonként fog megjelenni a telefonodon, mint bármelyik másik alkalmazás.</li>
          <li>A ❤️ ikonnal elmentheted a kedvenc helyeidet és programjaidat, amiket a fejlécben lévő szív ikonra kattintva bármikor elérhetsz.</li>
        </ul>

        {/* --- FRISSÍTETT SZEKCIÓ: Köszönetnyilvánítás --- */}
        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Köszönetnyilvánítás</h2>
        <p className="text-gray-300 mb-4">Ez a projekt nem jöhetett volna létre a közreműködők és segítők nélkül:</p>
        <ul className="list-none text-gray-200 mb-8 space-y-2">
          <li><strong>Domainnév:</strong> Egy titkos jótevőnek, akinek a nevét homály fedi! 😉</li>
          <li><strong>Időjárás adatok:</strong> Ráduly Lászlónak és a Kőszegi Időjárás Előrejelzésnek a mindig pontos infókért.</li>
          <li><strong>Túrainformációk:</strong> A KKE Alpok Cycles csapatának.</li>
          <li><strong>Közösségi támogatás:</strong> A "Kőszeg a mesebeli kisváros" Facebook csoport adminisztrátorának.</li>
          <li><strong>És a fantasztikus látványért:</strong></li>
          <li className="pl-4 font-bold text-lg text-cyan-400">DESIGN: Hidalmási Erik</li>
        </ul>

        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Kapcsolat</h2>
        <p className="text-gray-200 mb-8">
          Hibát találtál, vagy van egy jó ötleted? Írj nekünk!
          <a href="mailto:koszegapp@gmail.com" className="block mt-2 text-cyan-400 text-lg font-semibold underline hover:text-pink-400 transition">
            koszegapp@gmail.com
          </a>
        </p>

        {/* --- FRISSÍTETT SZEKCIÓ: Technológiai háttér --- */}
        <div className="mt-10 text-xs text-center text-cyan-500 opacity-70">
          <p className="mb-1">Fejlesztéshez használt technológiák:</p>
          <p className="font-mono tracking-widest">
            React • Vite • TailwindCSS • React Router • i18next • date-fns
          </p>
          <p className="mt-2 mb-1">Felhasznált API-k és szolgáltatások:</p>
          <p className="font-mono">
            OpenAI • Google API • Facebook API • OpenWeather API • Netlify
          </p>
          <div className="mt-6 animate-pulse hover:animate-none transition">
            👾 Hidden glitch: <span className="text-pink-400 font-bold">404 - CYBERPUNK KŐSZEG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
