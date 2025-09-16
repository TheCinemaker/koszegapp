import React, { useState, useEffect, useRef } from 'react';

export default function OstromDrawerFullAnimated() {
  const [openDrawer, setOpenDrawer] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const closeTimerRef = useRef(null);
  const initializedRef = useRef(false);

  const defaultTab = 'szuret';

  const [highlightImages] = useState([
    "/images/highlights/noevent.png"
  ]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onBeforeUnload = () => {
      sessionStorage.removeItem("drawerShown");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const alreadyShown = sessionStorage.getItem("drawerShown");
    if (!alreadyShown) {
      const t = setTimeout(() => {
        setOpenDrawer(defaultTab);
        sessionStorage.setItem("drawerShown", "true");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (openDrawer !== null && !hasInteracted) {
      closeTimerRef.current = setTimeout(() => setOpenDrawer(null), 5000);
      return () => clearTimeout(closeTimerRef.current);
    }
  }, [openDrawer, hasInteracted]);

  useEffect(() => {
    if (openDrawer === 'kiemelt' && !modalOpen) {
      const iv = setInterval(() => {
        setCurrentImageIdx(i => (i + 1) % highlightImages.length);
      }, 2000);
      return () => clearInterval(iv);
    }
  }, [openDrawer, modalOpen, highlightImages.length]);

  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    }
  };

  const handleDrawerClick = (type) => {
    setOpenDrawer(type);
    setHasInteracted(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  };

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartX.current - currentX;

    if (diffX > 50 && !openDrawer) {
      handleDrawerClick(defaultTab);
      touchStartX.current = null;
    }
    if (diffX < -50 && openDrawer) {
      handleDrawerClick(null);
      touchStartX.current = null;
    }
  };
  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  return (
    <>
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] transition-all duration-700"
          onClick={() => setModalOpen(false)}
        >
          <div className="text-center absolute top-4 w-full text-white text-xs font-bold">Kattints a bezáráshoz!</div>
          <img 
            src={highlightImages[currentImageIdx]} 
            alt={`tuzoltonap-${currentImageIdx}`} 
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
        className={`fixed top-[50px] right-0 z-50 transform transition-transform duration-700 ease-in-out ${openDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div
          onScroll={handleUserInteraction}
          onMouseDown={handleUserInteraction}
          className={`w-72 h-[75vh] shadow-xl border-l-4 rounded-l-2xl overflow-y-auto font-sans flex flex-col ${openDrawer === 'kiemelt' ? 'bg-red-700 text-white border-red-900' : 'bg-green-100 text-green-900 border-green-500'}`}
        >
          <div className={`sticky top-0 px-4 py-3 flex justify-between items-center border-b z-10 ${openDrawer === 'kiemelt' ? 'bg-red-800 border-red-900 text-white' : 'bg-green-200 border-green-400'}`}>
            <h3 className="text-lg font-extrabold">{openDrawer === 'kiemelt' ? '🚒 TŰZOLTÓNAP' : '🍇 Szüret 2025'}</h3>
            <button onClick={() => setOpenDrawer(null)} className="text-2xl font-bold hover:scale-125 transition" aria-label="Bezárás">✖</button>
          </div>

          <div className="p-4 flex-1 space-y-6 text-sm leading-relaxed overflow-y-auto">
            {openDrawer === 'kiemelt' ? (
              <div className="text-left space-y-4">
                <h2 className="text-base font-extrabold tracking-wide">X. Tűzoltó Találkozó és bemutató</h2>
                <p className="text-xs opacity-90 italic">Tisztelettel és nagy előkészítő munkával várja Önöket a 157 éves tűzoltó egyesületünk minden tagja – a nyolcvanas évekig Magyarország legkisebb és 1328 óta szabad királyi városában, Kőszegen.</p>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">📅 Időpont & helyszín</h4>
                  <ul className="list-disc ml-5 text-sm">
                    <li><span className="font-semibold">Szeptember 20.</span> (szombat)</li>
                    <li><span className="font-semibold">09:30</span> – Megnyitó a <span className="italic">Jurisics téren</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">🚒 Felsorakozás</h4>
                  <p className="text-sm">A kezdésre a <span className="font-semibold">Károly Róbert téren</span> közel <span className="font-semibold">70 tűzoltóautó</span> sorakozik fel.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">🎺 Ünnepélyes átvonulás</h4>
                  <p className="text-sm">A megnyitót követően Kőszeg Város Koncert Fúvószenekara vezetésével a csapatok a tűzoltóság épületéhez vonulnak, ahol az összetartozást jelképező táblákat helyezik el.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">🏕️ Bemutató sátrak (Fő tér)</h4>
                  <ul className="list-disc ml-5 text-sm">
                    <li>Tűzoltó drónok</li>
                    <li>Rendőrség</li>
                    <li>Katonaság</li>
                    <li>Büntetés-végrehajtás</li>
                    <li>Kéményseprők</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">🔧 Műszaki és sport bemutatók</h4>
                  <ul className="list-disc ml-5 text-sm">
                    <li>Fő tér: tűzoltók <span className="font-semibold">műszaki mentési bemutatója</span></li>
                    <li>Kőszegi Fitt Box program</li>
                    <li>Celldömölki tűzoltók <span className="font-semibold">alpintechnikai bemutatója</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">👧 Gyermekprogramok (Jurisics tér)</h4>
                  <ul className="list-disc ml-5 text-sm">
                    <li><span className="font-semibold">10:30</span> – Gyerek tűzoltó ügyességi pálya</li>
                    <li>Quad motor és Tűzoltó <span className="italic">Manó mobil</span></li>
                    <li><span className="font-semibold">11:40</span> – A pályát teljesítők <span className="font-semibold">kis tűzoltó esküje</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">🗺️ Délutáni felvonulás útvonala</h4>
                  <p className="text-sm"><span className="font-semibold">14:40</span>-kor a közel 70 tűzoltó gépjármű el-/felvonul:</p>
                  <p className="text-sm ml-2">Károly Róbert tér → Várkör → Kossuth Lajos utca → Munkácsy Mihály utca → Rákóczi Ferenc utca → Szombathelyi út → 87-es főút</p>
                </div>

                <div className="pt-3 mt-3 border-t text-xs opacity-80 text-center">A műsorváltoztatás jogát fenntartjuk.</div>
              </div>
            ) : (
              <div className="text-left text-sm text-green-900 space-y-5">
                <div>
                  <h4 className="font-extrabold text-base text-green-800 pb-2 mb-3 border-b-2 border-green-300">Szeptember 26., Péntek</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">17:00 – Ifjúsági Fúvószenekar</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">17:30 – Hivatalos Megnyitó</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">18:00 – Gájer Bálint</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">19:00 – Fúvós Szerenád</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">21:00 – Be-Jó Tűztánc & Silverbirds</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">21:30 – Soulwave Koncert</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-green-800 pb-2 mb-3 border-b-2 border-green-300">Szeptember 27., Szombat</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">10:00 – Vendégzenekarok fogadása</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">13:15 – Zenekarok felvonulása</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Károly Róbert tér-től</p>
                    </div>
                    <div>
                      <p className="font-semibold">14:00 – Szüreti Karnevál</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Város utcáin</p>
                    </div>
                    <div>
                      <p className="font-semibold">16:00 – Fúvós térzenék & Táncbemutatók</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér, Jurisics tér, Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">17:30 – Fúvós-Show</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">18:00 – Prokofjev, Korponay, Bánó</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">21:00 – Szüreti Bál - Fáraó</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-green-800 pb-2 mb-3 border-b-2 border-green-300">Szeptember 28., Vasárnap</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">11:00 – Fúvószenekari Térzene</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Jurisics tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">14:00 – Westside TSE</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">15:00 – Hajnalcsillag Néptáncegyüttes</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                    <div>
                      <p className="font-semibold">15:00 – Yahamo Brass Band & more</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Fő tér</p>
                    </div>
                    <div>
                      <p className="font-semibold">18:00 – Sing Sing & Zorall Koncert</p>
                      <p className="text-xs text-green-700/80 ml-5">📍 Rendezvénysátor</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t-2 border-green-300 text-xs italic text-green-800/80 text-center">
                  <p>A rendezvény ideje alatt Vidámpark, kézműves vásár, étel- és italkülönlegességek várják a látogatókat!</p>
                  <p className="mt-2">A műsorváltoztatás jogát fenntartjuk!</p>
                </div>
              </div>
            )}
          </div>

          <div className={`sticky bottom-0 text-center py-2 text-xs font-bold border-t ${openDrawer === 'kiemelt' ? 'bg-red-800 border-red-900 text-white' : 'bg-green-200 border-green-400'}`}>© KőszegAPP – 2025</div>
        </div>

        <div
          onClick={() => handleDrawerClick('szuret')}
          className={`absolute top-[35%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left cursor-pointer transition ${openDrawer === 'szuret' ? 'bg-green-400 text-green-900 border-green-600' : 'bg-green-200 text-green-700 border-green-400 opacity-70'} hover:bg-green-300`}
        >
          <span className="text-xs font-bold">SZÜRET 2025</span>
        </div>

        <div
          onClick={() => handleDrawerClick('kiemelt')}
          className={`absolute top-[55%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left cursor-pointer transition ${openDrawer === 'kiemelt' ? 'bg-red-600 text-white border-red-900' : 'bg-red-200 text-red-800 border-red-400 opacity-80'} hover:bg-red-400 hover:text-white`}
        >
          <span className="text-xs font-bold">TŰZOLTÓNAP</span>
        </div>
      </div>
    </>
  );
}
