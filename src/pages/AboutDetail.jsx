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
  A <span className="text-pink-400 font-semibold">KőszegAPP</span> egy mobilbarát webapp,
  amelynek célja, hogy a városba látogató turisták és helyiek egy helyen, átlátható formában
  találják meg Kőszeg legizgalmasabb pontjait, programjait, éttermeit, parkolási lehetőségeit
  és egyéb hasznos közérdekű információkat. Igyekeztünk minden fontos adatot összegyűjteni és
  folyamatosan frissíteni. Az APP-ba mesterséges intelligencia (AI) alapú chatsegéd is
  be van építve, amely barátságosan próbál válaszolni a várossal kapcsolatos kérdésekre.
  A rendszer azonban még fejlődő fázisban van, ezért előfordulhat, hogy hibás vagy pontatlan
  választ ad – ha ilyet találsz, kérlek jelezd nekünk az elérhetőségeinken!

  A fejlesztés és a kód teljes mértékben privát, városi vagy önkormányzati anyagi és/vagy szellemi segítség nélkül
  készült. Fontos kiemelni, hogy a <span className="text-pink-400 font-semibold">KőszegAPP</span>
  egy magánszemély által létrehozott, nem üzleti célú projekt. Cégként vagy gazdasági
  társaságként a „Kőszeg” név használatához a helyi önkormányzat jegyzőjének hivatalos
  engedélye szükséges lenne a településnév-használatra vonatkozó jogszabályok alapján.
  A Kőszeg név használata kizárólag magánszemélyként, város iránti elköteleződésből történik, nem kereskedelmi vagy hivatalos célokra.
  Ez az alkalmazás azonban nem cég, hanem egy helyi lakos lelkes magánmunkája.

  Az alkalmazásban szereplő információk a legjobb tudásunk szerint kerültek összegyűjtésre,
  ugyanakkor nem minősülnek hivatalos tájékoztatásnak. Kérjük, minden fontos adatot
  (például nyitvatartás, telefonszám) ellenőrizz közvetlenül az adott szolgáltatónál!
</p>


        <p className="text-gray-300 mb-8 leading-relaxed text-md drop-shadow-[0_0_3px_cyan] italic">
          Az APP-ot folyamatosan fejlesztjük, folyamatosan frissítjük, AI adatgyűjtéssel és manuális validációval. 
          <br/>
          <span className="text-sm text-cyan-300">(powered by: OpenAI, Google, Facebook API, Openweather API, DeepseekAI, NetlifyAPP)</span>
        </p>

        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Hogyan használd?</h2>
        <ul className="list-disc list-inside text-gray-200 mb-8 space-y-1">
          <li>Nyisd meg a <span className="text-cyan-300">visitkoszeg.hu</span> oldalt a mobilodon.</li>
          <li>Koppints a böngésző menüre → „Hozzáadás a kezdőképernyőhöz”.</li>
          <li>Ezután ikonként fog megjelenni a telefonodon, mint bármelyik applikáció.</li>
          <li>Ha bármilyen észrevételed van, ne habozz, keress minket az alább található email-en!</li>
        </ul>

        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Partnereink:</h2>
        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Köszönjük a segítséget:</h2>
        <ul className="list-disc list-inside text-gray-200 mb-8 space-y-1">
          <li>A DOMAINNÉV kitalálója: Tóth Gábor/Tóth Pincészet</li>
          <li>A mindig bejövős infókért: Kőszegi Időjárás Előrejelzés / Ráduly László</li>
          <li>Túrainfókért: KKE Alpok Cycles</li>
          <li>és nem utolsó sorban a fantasztikus látványért: </li>
          <li>DESIGN: Hidalmási Erik </li>
        </ul>

        <h2 className="text-3xl font-bold text-pink-400 mb-4 drop-shadow-[0_0_6px_pink]">Kapcsolat</h2>
        <p className="text-gray-200 mb-8">
          Írj nekünk: 
          <a href="mailto:koszegapp@gmail.com" className="text-cyan-400 underline hover:text-pink-400 transition ml-2">
            koszegapp@gmail.com
          </a>
        </p>

        {/* Easter egg */}
        <div className="mt-10 text-center text-xs text-cyan-500 animate-pulse opacity-70 hover:opacity-100 transition">
          👾 Hidden glitch: <span className="text-pink-400 font-bold">404 - CYBER</span>
        </div>
      </div>
    </div>
  );
}
