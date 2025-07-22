export default function ProgramModal({ onClose }) {
  const [userLocation, setUserLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Külön függvénybe szervezve a visszaszámláló számítását
  function calculateTimeLeft() {
    const now = new Date();
    const ostromStart = new Date('2025-08-01T08:00:00');
    const diff = ostromStart - now;
    
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
      isOver: diff < 0
    };
  }

  // Események kiértékelése
  const evaluateEvents = () => {
    const now = new Date();
    const today = events.filter(e => isSameDay(e.start, now));

    const curr = today.filter(e => 
      isBefore(e.start, now) && 
      (e.end ? isAfter(e.end, now) : true)
    );
    
    const nxt = today
      .filter(e => isAfter(e.start, now))
      .sort((a, b) => a.start - b.start)[0];

    setCurrentEvents(curr);
    setNextEvent(nxt);
  };

  useEffect(() => {
    // Visszaszámláló timer
    const countdownTimer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Események betöltése
    fetch('/data/programok.json')
      .then(res => res.json())
      .then(arr => {
        const parsed = arr.map(p => {
          try {
            return {
              ...p,
              start: parseISO(p.idopont),
              end: p.veg_idopont ? parseISO(p.veg_idopont) : 
                new Date(parseISO(p.idopont).getTime() + 60 * 60000),
              kiemelt: !!p.kiemelt
            };
          } catch (error) {
            console.error('Hibás dátumformátum:', p.idopont, error);
            return null;
          }
        }).filter(Boolean);
        setEvents(parsed);
      });

    // Pozíció lekérdezése
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('Helymeghatározás hiba:', err)
    );

    // Események periodikus ellenőrzése
    const eventCheckTimer = setInterval(evaluateEvents, 1000);
    
    return () => {
      clearInterval(countdownTimer);
      clearInterval(eventCheckTimer);
    };
  }, []);

  const noEvents = currentEvents.length === 0 && !nextEvent;

return (
  <>
    <div className="fixed inset-y-[30px] inset-x-0 overflow-y-auto z-[999] px-4">
      {/* FEJLÉC - STICKY POZÍCIONÁLÁSSAL */}
      <div className="sticky top-0 z-10 bg-amber-600 dark:bg-amber-900 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center">
        <h2 className="text-xl font-bold">
          🏰 Kőszegi Ostromnapok 2025
        </h2>
        
        {/* VISSZASZÁMLÁLÓ - CSAK HA MÉG NEM JÁRT LE */}
        {!timeLeft.isOver && (
          <div className="bg-amber-800/80 px-3 py-1 rounded-lg">
            <span className="font-mono text-sm sm:text-base">
              {timeLeft.days} nap {timeLeft.hours} óra {timeLeft.minutes} perc
            </span>
            <span className="font-mono ml-2 text-xs sm:text-sm">
              {timeLeft.seconds}s
            </span>
          </div>
        )}
        
        <button 
          onClick={onClose} 
          className="text-2xl hover:text-amber-200"
          aria-label="Bezárás"
        >
          ×
        </button>
      </div>

      {/* TARTALOM KONTÉNER - GÖRHETŐ RÉSZ */}
      <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 shadow-xl rounded-b-2xl p-4 mx-auto max-w-3xl border border-amber-300 dark:border-amber-700 relative max-h-[80vh] overflow-y-auto">
        
        {/* NINCS ESEMÉNY ÜZENET */}
        {noEvents && (
          <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">
            🎉 Nincs több esemény mára! Nézz vissza később, vagy lapozz a holnapi napra.
          </p>
        )}

        {/* JELENLEG ZAJLÓ ESEMÉNYEK */}
        {currentEvents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
              🎬 Jelenleg zajló események ({currentEvents.length})
            </h3>
            {currentEvents.map(event => (
              <div
                key={event.id}
                className="mb-3 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer hover:shadow transition"
                onClick={() => setSelectedProgram(event)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold">{event.nev}</p>
                    <p className="text-sm mt-1">
                      📍 {event.helyszin.nev}<br />
                      🕘 {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
                    </p>
                  </div>
                  {event.kiemelt && (
                    <span className="ml-2 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      ⭐ Kiemelt
                    </span>
                  )}
                </div>
                {userLocation && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${event.helyszin.lat},${event.helyszin.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-sm font-semibold text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
                    onClick={e => e.stopPropagation()}
                  >
                    🧭 Útvonal megtekintése
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* KÖVETKEZŐ ESEMÉNY */}
        {nextEvent && (
          <div
            className="mb-4 p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-600 cursor-pointer hover:shadow transition"
            onClick={() => setSelectedProgram(nextEvent)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">⏭️ Következő esemény</h3>
                <p className="text-base font-bold">{nextEvent.nev}</p>
                <p className="text-sm mt-1">
                  🕘 {format(nextEvent.start, 'HH:mm')} kezdésig: <Countdown target={nextEvent.start} />
                </p>
              </div>
              {nextEvent.kiemelt && (
                <span className="ml-2 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⭐ Kiemelt
                </span>
              )}
            </div>
            {userLocation && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sm font-semibold text-yellow-700 underline hover:text-yellow-900 dark:text-yellow-300"
                onClick={e => e.stopPropagation()}
              >
                🧭 Vigyél oda
              </a>
            )}
          </div>
        )}

        {/* TÉRKÉP */}
        {userLocation && (currentEvents.length > 0 || nextEvent) && (
          <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
            <MapContainer
              center={[
                currentEvents[0]?.helyszin?.lat || nextEvent?.helyszin?.lat || userLocation.lat,
                currentEvents[0]?.helyszin?.lng || nextEvent?.helyszin?.lng || userLocation.lng
              ]}
              zoom={17}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={userLocation}><Popup>📍 Itt vagy</Popup></Marker>
              {currentEvents.map(e => (
                <Marker key={e.id} position={[e.helyszin.lat, e.helyszin.lng]}>
                  <Popup>
                    <strong>{e.nev}</strong><br />
                    {format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}
                  </Popup>
                </Marker>
              ))}
              {nextEvent && !currentEvents.some(e => e.id === nextEvent.id) && (
                <Marker 
                  position={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]}
                  icon={L.icon({
                    ...L.Icon.Default.prototype.options,
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
                  })}
                >
                  <Popup>
                    <strong>{nextEvent.nev}</strong><br />
                    Kezdés: {format(nextEvent.start, 'HH:mm')}
                  </Popup>
                </Marker>
              )}
              <CenterMap center={[
                currentEvents[0]?.helyszin?.lat || nextEvent?.helyszin?.lat || userLocation.lat,
                currentEvents[0]?.helyszin?.lng || nextEvent?.helyszin?.lng || userLocation.lng
              ]} />
            </MapContainer>
          </div>
        )}

      </div> {/* TARTALOM KONTÉNER VÉGE */}
    </div>

    {/* RÉSZLETES NÉZET (BOTTOM SHEET) */}
    <ProgramDetailsSheet
      program={selectedProgram}
      onClose={() => setSelectedProgram(null)}
    />
  </>
);
}
