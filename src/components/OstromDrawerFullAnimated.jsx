import React, { useState, useEffect, useRef } from 'react';

export default function OstromDrawerFullAnimated() {
  const [openDrawer, setOpenDrawer] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const closeTimerRef = useRef(null);

  const [highlightImages] = useState([
    "/images/highlights/IMG_1722.jpeg",
    "/images/highlights/IMG_1723.jpeg",
    "/images/highlights/IMG_1724.jpeg",
    "/images/highlights/IMG_1725.jpeg",
    "/images/highlights/tothaug1.jpeg"
  ]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ Nyitás oldalbetöltéskor egyszer, ha még nem történt meg
  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem('drawerShown');
    if (!alreadyOpened) {
      const openTimer = setTimeout(() => {
        setOpenDrawer('ostrom');
        sessionStorage.setItem('drawerShown', 'true');
      }, 2000);
      return () => clearTimeout(openTimer);
    }
  }, []);

  // ✅ Ha nincs interakció, 5 mp után záródjon
  useEffect(() => {
    if (openDrawer !== null && !hasInteracted) {
      closeTimerRef.current = setTimeout(() => {
        setOpenDrawer(null);
      }, 5000);
      return () => clearTimeout(closeTimerRef.current);
    }
  }, [openDrawer, hasInteracted]);

  // ✅ Slide show a kiemelt képeknél
  useEffect(() => {
    if (openDrawer === 'kiemelt' && !modalOpen) {
      const interval = setInterval(() => {
        setCurrentImageIdx(prev => (prev + 1) % highlightImages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [openDrawer, modalOpen, highlightImages.length]);

  // ✅ Ha bármilyen interakció történik, ne záródjon magától
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    }
  };

  // ✅ Drawer nyitása manuálisan
  const handleDrawerClick = (drawerType) => {
    setOpenDrawer(drawerType);
    setHasInteracted(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  };

  // ✅ Swipe-hoz (érintőkijelzőn)
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartX.current - currentX;

    if (diffX > 50 && !openDrawer) {
      setOpenDrawer('ostrom'); // balra suhintás nyitás
      setHasInteracted(true);
      touchStartX.current = null;
    }
    if (diffX < -50 && openDrawer) {
      setOpenDrawer(null); // jobbra suhintás zárás
      setHasInteracted(true);
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };
  const ostromProgram = [
  {
    day: "Felvezető programok",
    date: "Július 30.–augusztus 1.",
    events: [
      {
        time: "",
        title: "18. Ostrom Kupa Nemzetközi ökölvívó verseny",
        location: "Főtér (rossz idő esetén: Balogh Iskola tornacsarnok)",
        details: [
          "július 30. 15 órától",
          "július 31. 14 órától",
          "augusztus 1. 11 órától"
        ]
      },
      {
        time: "",
        title: "4. Ostrom Várvédő jótékonysági Futóverseny",
        location: "Fő tér / Mirtill Alapítvány",
        details: [
          "augusztus 2. Fő tér tömegfutás",
          "1,5 km, 7 km, 14 km, 21 km a váron és a török táboron át",
          "Nevezés: helyszínen 7.30–8.30 vagy online",
          "8.45-kor bemelegítés Hámori Lucával",
          "Rajt 9 órakor",
          "Ataru Taiko és hagyományőrzők színesítik",
          "Teljes bevétel jótékony cél"
        ]
      },
      {
        time: "",
        title: "Honvédelmi Sportnap",
        location: "",
        details: [
          "augusztus 1. péntek",
          "10:00 Ökölvívó bemutató a Fő téren",
          "10:30 Hagyományőrző bemutató – Fő tér",
          "11:00 Íjászat – Diáksétány",
          "11:30 Lézer lövészet és akadálypálya",
          "12:00 Jurisics Miklós szobrának meglátogatása",
          "augusztus 2. szombat 9:00 Tömegfutás a történelmi óváros és a váron át"
        ]
      },
      {
        time: "",
        title: "Csütörtöktől: Birta Roland képzőművész tollrajzai",
        location: "Jurisics vár"
      }
    ]
  },
  {
    day: "Ostromhétvége - Augusztus 1. péntek",
    events: [
      { time: "15:32", title: "XVIII. Kőszegi Ostromnapokat megnyitó puskálövések", location: "Hősök tornya" },
      { time: "16:00", title: "Ostrom kupa „megtámadása”", location: "Fő tér" },
      { time: "16:30–17:20", title: "Kőszegi Vonósok", location: "Jurisics tér – Tábornokház loggia" },
      { time: "17:20–17:50", title: "BE-JÓ Történelmi Táncegyüttes", location: "Jurisics tér" },
      { time: "17:50", title: "Kőszegi Tornyosok bemutató", location: "Hősök tornya" },
      { time: "18:00", title: "Ostromállapot kihirdetése", location: "Jurisics tér – Tábornokház loggia" },
      { time: "19:00", title: "Horvát Táncház – Zsidányi Csillagocskák", location: "Jurisics tér" },
      { time: "20:00", title: "„Ég a város, ég a vár is” tűzes török támadás", location: "Lépcsős várárok" },
      { time: "21:05", title: "Fáklyás vonulás", location: "Várárkoktól a Jurisics térre" },
      { time: "21:30–22:00", title: "BE-JÓ Történelmi Táncegyüttes tűztánca", location: "Jurisics tér" },
      { time: "21:30", title: "„Török lesen” Jelmezes túra", location: "Találkozó: Tourinform iroda, Fő tér 2." },
      { time: "21:30", title: "OCHO MACHO koncert", location: "Fő tér" }
    ]
  },
  {
    day: "Augusztus 2. szombat",
    events: [
      { time: "9:00", title: "Éjszakai patronok kilövése", location: "Hősök tornya, Fő tér" },
      { time: "9:00", title: "IV. Ostrom Várvédő futás rajt", location: "Fő tér (9:00, 9:15, 9:30)" },
      { time: "9:15", title: "Kőszeg védművei séta", location: "Hősök tornya, Révész József vezetésével" },
      { time: "10:00", title: "A török sereg sétája a belvárosban" },
      { time: "11:00", title: "Vadászkutya bemutató", location: "Várárok" },
      { time: "11:00", title: "Várvédő mustra", location: "Jurisics tér" },
      { time: "11:30", title: "Szablyatánc – „Czenki” Hársfa Néptáncegyüttes", location: "Jurisics tér" },
      { time: "13:00", title: "Vásártér", location: "Fő tér" },
      { time: "13:00", title: "Tárlatvezetés a Jurisics vár állandó kiállításában", note: "Várbelépő vagy Múzeumostrom bérlet szükséges" },
      { time: "13:30", title: "Pattantyús Martalócok Tüzérségi bemutató", location: "Fő tér" },
      { time: "14:00", title: "Dr. Bilkei Irén előadása", location: "Jurisics vár", note: "16. századi várélet" },
      { time: "14:30", title: "Batthyány Lovas Bandérium bemutatója", location: "Lépcsős várárok" },
      { time: "15:00", title: "Nyugati Vármegye Vitézlő Rendje lovasbemutatója", location: "Lépcsős várárok" },
      { time: "15:30", title: "SilverBirds Bellydance Egyesület hastánc", location: "Fő tér" },
      { time: "16:30", title: "Ostrom felvonulás", location: "Jurisics vár – Diáksétány" },
      { time: "18:00", title: "Kőszegi Tornyosok bemutató", location: "Hősök tornya" },
      { time: "18:30", title: "Várostrom", location: "Várfal, Diáksétány" },
      { time: "20:00", title: "Kőszeg Város Koncert Fúvószenekara", location: "Jurisics tér" },
      { time: "21:00", title: "Régi Világzene-Szelindek koncert", location: "Fő tér" },
      { time: "22:00", title: "Retro Disco", location: "Fő tér" },
      { time: "10:00–16:00", title: "Ifjú Vitéz Próba", note: "12-13 között szünet / Jurisics vár katonai táborok" },
      { time: "10:30; 15:30", title: "Gyermek ostrom", note: "5-14 év közötti gyerekeknek" }
    ]
  },
  {
    day: "Augusztus 3. vasárnap",
    events: [
      { time: "9:00", title: "Ostromtúra a Szulejmán-kilátóhoz", note: "8 km, indulás: Tourinform Fő tér 2." },
      { time: "10:30", title: "„Harangszóig” csatajelenetes megemlékezés", location: "Diáksétány" },
      { time: "11:00", title: "ESŐNAP", note: "szombati rossz idő esetén várostrom" },
      { time: "11:30", title: "Tárlatvezetés a Tábornokházban és Hősök tornyában", note: "Múzeum belépő vagy Múzeumostrom bérlet szükséges" },
      { time: "13:00", title: "Kőszegi Borkereskedelem – Jurisics Bandérium bemutató", location: "Fő tér" },
      { time: "14:00", title: "Gyulaffy Bandérium viselet & fegyverzet bemutató", location: "Fő tér" },
      { time: "15:00", title: "SilverBirds Bellydance hastánc", location: "Fő tér" },
      { time: "15:00", title: "Barátkozás Marton-Szállás lovaival", location: "Várárok" },
      { time: "15:32", title: "Hagyományőrző csapatok koszorúzása" },
      { time: "16:00", title: "Gyermek-felnőtt ostrom", location: "Lépcsős várárok" },
      { time: "16:00–17:30", title: "Bogyla Zenekar & Hajnalcsillag Néptáncegyüttes koncert & táncház", location: "Fő tér" },
      { time: "17:30–18:30", title: "„A magyarok nyilaitól…” – Marton-Szállás lovas íjászbemutató", location: "Várárok" },
      { time: "19:00", title: "Ataru Taiko koncert", location: "Jurisics vár" },
      { time: "11:30; 14:30", title: "Gyermek Ostrom", note: "5-14 év közötti gyerekeknek" },
      { time: "10:00–17:00", title: "Kézműves foglalkozások", location: "Csók István Művészkör, Jurisics vár elővár" }
    ],
    footer: "*MÚZEUMOSTROM – közös kedvezményes belépő a Jurisics vár és Kőszegi Városi Múzeum helyszínekre augusztus 10-ig ingyenes visszatérésre jogosít.",
    disclaimer: "A programváltozás jogát fenntartjuk!"
  }
];

    return (
    <>
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] transition-all duration-700"
          onClick={() => setModalOpen(false)}
        >
          <div className="text-center absolute top-4 w-full text-white text-xs font-bold">
            Kattints a bezáráshoz!
          </div>
          <img 
            src={highlightImages[currentImageIdx]} 
            alt={`kiemelt-${currentImageIdx}`} 
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-2xl transition-transform duration-700 transform scale-100"
          />
        </div>
      )}

      {openDrawer && (
        <div
          className="fixed inset-0 z-40 transition-all duration-700 ease-in-out bg-black/20"
          style={{ backdropFilter: 'blur(4px) grayscale(100%)' }}
          onClick={() => setOpenDrawer(null)}
        />
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-[50px] right-0 z-50 transform transition-transform duration-700 ease-in-out
          ${openDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div
          onScroll={handleUserInteraction}
          onTouchMove={handleUserInteraction}
          className={`w-72 h-[75vh] shadow-xl border-l-4 rounded-l-2xl overflow-y-auto font-sans flex flex-col
            ${openDrawer === 'ostrom'
              ? 'bg-amber-100 text-amber-900 border-amber-500'
              : openDrawer === 'kiemelt'
              ? 'bg-purple-100 text-purple-900 border-purple-500'
              : 'bg-green-100 text-green-900 border-green-500'
            }`}
        >
          <div className={`sticky top-0 px-4 py-3 flex justify-between items-center border-b z-10
            ${openDrawer === 'ostrom'
              ? 'bg-amber-200 border-amber-400'
              : openDrawer === 'kiemelt'
              ? 'bg-purple-200 border-purple-400'
              : 'bg-green-200 border-green-400'
            }`}
          >
            <h3 className="text-lg font-extrabold">
              {openDrawer === 'ostrom' ? '🎯 Ostromnapok' :
               openDrawer === 'kiemelt' ? '✨ KIEMELT FELÜLET' :
               '🍇 Szüret 2025'}
            </h3>
            <button
              onClick={() => setOpenDrawer(null)}
              className="text-2xl font-bold hover:scale-125 transition"
              aria-label="Bezárás"
            >
              ✖
            </button>
          </div>

          <div className="p-4 flex-1 space-y-6 text-sm leading-relaxed overflow-y-auto">
            {openDrawer === 'ostrom' ? (
              ostromProgram.map((section, si) => (
                <div key={si} className="space-y-3">
                  <p className="text-amber-900 text-lg font-extrabold border-b-2 border-amber-300 pb-1">
                    {section.day}
                  </p>
                  {section.events.map((evt, ei) => (
                    <div
                      key={ei}
                      className="flex items-start gap-3 p-2 bg-amber-50 rounded-xl shadow-sm hover:shadow transition"
                    >
                      <span className="text-amber-800 font-bold whitespace-nowrap">
                        ⏰ {evt.time}
                      </span>
                      <div>
                        <div className="font-semibold text-amber-900">{evt.title}</div>
                        {evt.location && (
                          <div className="italic text-xs mt-0.5 text-amber-700 bg-amber-200 rounded-full px-2 inline-block">
                            {evt.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {section.note && (
                    <div className="mt-3 p-3 bg-yellow-100 border-l-4 border-yellow-400 rounded text-amber-800 text-xs">
                      {section.note}
                    </div>
                  )}
                  {section.footer && (
                    <div className="mt-4 p-3 bg-amber-100 border-l-4 border-amber-400 rounded text-amber-900 text-sm">
                      {section.footer}
                    </div>
                  )}
                </div>
              ))
            ) : openDrawer === 'kiemelt' ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-extrabold text-purple-800">✨ KIEMELT</h2>
                <img
                  src={highlightImages[currentImageIdx]}
                  alt={`kiemelt-${currentImageIdx}`}
                  className="w-full rounded-xl shadow-lg cursor-pointer transition-all duration-700"
                  onClick={() => setModalOpen(true)}
                />
                <p className="text-center text-xs text-purple-700">Kiemelt hirdetések & események</p>
              </div>
            ) : (
              <div className="text-center font-bold text-green-800 text-lg space-y-3">
                🎉 COMING SOON – Szüreti programok hamarosan!
                <div className="mt-4 text-sm italic">
                  📍 Kőszegi Szüret 2025<br/>
                  Nemzetközi Fúvószenekari Találkozó<br/>
                  2025.09.26–28. / Fő tér
                </div>
              </div>
            )}
          </div>

          <div className={`sticky bottom-0 text-center py-2 text-xs font-bold border-t
            ${openDrawer === 'ostrom'
              ? 'bg-amber-200 border-amber-400'
              : openDrawer === 'kiemelt'
              ? 'bg-purple-200 border-purple-400'
              : 'bg-green-200 border-green-400'
            }`}
          >
            © KőszegAPP – 2025
          </div>
        </div>

        <div
          onClick={() => handleDrawerClick('ostrom')}
          className={`absolute top-[11%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center
            border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left
            cursor-pointer transition
            ${openDrawer === 'ostrom'
              ? 'bg-amber-400 text-amber-900 border-amber-600'
              : 'bg-amber-200 text-amber-700 border-amber-400 opacity-70'}
            hover:bg-amber-300`}
        >
          <span className="text-xs font-bold">OSTROMNAPOK</span>
        </div>

        <div
          onClick={() => handleDrawerClick('szuret')}
          className={`absolute top-[35%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center
            border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left
            cursor-pointer transition
            ${openDrawer === 'szuret'
              ? 'bg-green-400 text-green-900 border-green-600'
              : 'bg-green-200 text-green-700 border-green-400 opacity-70'}
            hover:bg-green-300`}
        >
          <span className="text-xs font-bold">SZÜRET 2025</span>
        </div>

        <div
          onClick={() => handleDrawerClick('kiemelt')}
            className={`absolute top-[55%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center
              border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left
              cursor-pointer transition
            ${openDrawer === 'kiemelt'
              ? 'bg-purple-400 text-white border-purple-600'
              : 'bg-purple-200 text-purple-700 border-purple-400 opacity-70'}
                hover:bg-purple-300`}
        >
            <span className="text-xs font-bold">KIEMELT FELÜLET</span>
        </div>
      </div>
    </>
  );
}

