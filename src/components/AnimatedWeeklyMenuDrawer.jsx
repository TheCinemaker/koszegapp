return (
  <>
    {/* Overlay háttér, ha nyitva van */}
    {open && (
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
    )}

    {/* Drawer panel */}
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => (touchStartX.current = null)}
      className={`fixed top-0 left-0 h-[85%] mt-6 z-50 transform transition-transform duration-300 ease-in-out
        pointer-events-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div
        className="w-2/3 max-w-sm h-full bg-blue-100 shadow-lg border-r-4 border-blue-400
                   rounded-r-xl overflow-hidden pointer-events-auto relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4 bg-blue-200">
          <h2 className="text-sm font-bold text-blue-800">{todayDate}</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-blue-800 hover:text-blue-900"
            aria-label="Bezárás"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div className="text-center text-lg font-bold text-blue-900 px-4 pb-2">
          Éttermek napi menüi
        </div>

        {/* Restaurant selector */}
        <div className="px-4 pb-3">
          <select
            className="w-full border p-2 rounded text-sm"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            aria-label="Válassz éttermet"
          >
            <option value="">Összes étterem</option>
            {restaurants.map((r, idx) => (
              <option key={idx} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Menü lista */}
        <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-180px)] space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
              >
                Újrapróbálom
              </button>
            </div>
          ) : todayMenus.length ? (
            todayMenus.map((menu, idx) => (
              <div key={`${menu.etterem}-${idx}`} className="bg-white p-3 rounded shadow">
                <div className="text-sm font-semibold text-blue-700">
                  {menu.etterem}
                  <div className="text-xs text-blue-700 italic">
                    {menu.kapcsolat && <div>Kapcsolat: {menu.kapcsolat}</div>}
                    {menu.hazhozszallitas && <div>Házhozszállítás: {menu.hazhozszallitas}</div>}
                    {(menu.price_a || menu.price_b || menu.price_c || menu.price_allando) && (
                      <div>
                        Árak:
                        {menu.price_a && ` A: ${menu.price_a} Ft`}
                        {menu.price_b && ` B: ${menu.price_b} Ft`}
                        {menu.price_c && ` C: ${menu.price_c} Ft`}
                        {menu.price_allando && ` Állandó: ${menu.price_allando} Ft`}
                      </div>
                    )}
                  </div>
                </div>
                <MenuCard data={menu} showTodayOnly={!selectedRestaurant} />
              </div>
            ))
          ) : (
            <div className="text-center text-blue-500 py-8">
              <p>Nincs elérhető napi menü.</p>
              {menus.length > 0 && (
                <p className="text-xs mt-2">
                  ({menus.length} étterem van a rendszerben, de nincs ma érvényes menü)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-center text-blue-800 py-2 border-t bg-blue-200">
          © KőszegAPP – {new Date().getFullYear()}
        </div>
      </div>
    </div>

    {/* Fül – mindig fixen bal oldalon, drawer-től függetlenül */}
    <div
      onClick={() => setOpen(o => !o)}
      className={`fixed top-1/2 left-0 z-50 transform -translate-y-1/2
                  px-3 py-1.5 w-24 h-8 flex items-center justify-center
                  border rounded-tr-2xl rounded-br-2xl shadow
                  rotate-90 origin-left cursor-pointer transition
                  ${open
                    ? 'bg-blue-400 text-white border-blue-600'
                    : 'bg-blue-200 text-blue-700 border-blue-400 opacity-70'}
                  hover:bg-blue-300`}
    >
      <span className="text-xs font-bold whitespace-nowrap">
        NAPI MENÜK
      </span>
    </div>
  </>
);
}
