import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

// Ikonok a részletes adatokhoz
import { WiHumidity, WiStrongWind, WiRaindrop, WiSunrise, WiSunset } from 'react-icons/wi';

const API_KEY = 'ebe4857b9813fcfd39e7ce692e491045'; 

// Segédfüggvény a nap nevének nagybetűsítéséhez
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function WeatherModal({ onClose }) {
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Koszeg,HU&units=metric&appid=${API_KEY}&lang=hu`)
      .then(res => res.json())
      .then(data => {
        if (data && data.list) {
          setFullData(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // useMemo-t használunk, hogy a bonyolult számítások csak egyszer fussanak le
  const processedData = useMemo(() => {
    if (!fullData) return null;

    // 1. A legelső (aktuális) időjárási adat
    const now = fullData.list[0];

    // 2. A következő 24 óra (8 * 3 óra)
    const hourly = fullData.list.slice(0, 8);
    
    // 3. Napi bontás a következő napokra
    const dailyData = fullData.list.reduce((acc, reading) => {
      const date = format(new Date(reading.dt * 1000), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          dayName: format(new Date(reading.dt * 1000), 'eeee', { locale: hu }),
          temps: [],
          icons: []
        };
      }
      acc[date].temps.push(reading.main.temp);
      acc[date].icons.push(reading.weather[0].icon);
      return acc;
    }, {});
    
    const daily = Object.values(dailyData).map(day => ({
      dayName: capitalize(day.dayName),
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      icon: day.icons[Math.floor(day.icons.length / 2)] || day.icons[0]
    })).slice(0, 5); // Max 5 napot mutatunk

    return {
      city: fullData.city,
      now,
      hourly,
      daily
    };
  }, [fullData]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadein-fast" onClick={onClose}>
      <div 
        className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-6 w-11/12 max-w-lg m-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800 dark:hover:text-white z-10">×</button>
        
        {loading ? (
          <p className="text-center p-10">Előrejelzés betöltése...</p>
        ) : !processedData ? (
          <p className="text-center p-10">Nem sikerült betölteni az előrejelzést.</p>
        ) : (
          <>
            {/* === FEJLÉC ÉS JELENLEGI IDŐJÁRÁS === */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">{processedData.city.name}</h2>
              <div className="flex items-center justify-center -my-2">
                <img src={`https://openweathermap.org/img/wn/${processedData.now.weather[0].icon}@4x.png`} alt="weather icon" className="w-24 h-24" />
                <div className="text-left">
                  <p className="text-5xl font-bold">{Math.round(processedData.now.main.temp)}°C</p>
                  <p className="text-sm capitalize -mt-1">{processedData.now.weather[0].description}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hőérzet: {Math.round(processedData.now.main.feels_like)}°C</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* === KÖVETKEZŐ ÓRÁK (GÖRGETHETŐ) === */}
              <section>
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">Óránkénti előrejelzés</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {processedData.hourly.map((period, index) => (
                    <div key={index} className="flex-shrink-0 flex flex-col items-center bg-white/30 dark:bg-gray-700/50 rounded-lg p-2 w-20 text-center">
                      <p className="text-sm font-semibold">{format(new Date(period.dt * 1000), 'HH:mm')}</p>
                      <img src={`https://openweathermap.org/img/wn/${period.weather[0].icon}@2x.png`} alt="icon" className="w-12 h-12 -my-1" />
                      <p className="font-bold text-lg">{Math.round(period.main.temp)}°</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* === KÖVETKEZŐ NAPOK === */}
              <section>
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">5 napos előrejelzés</h3>
                <div className="space-y-2">
                  {processedData.daily.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg">
                      <p className="font-semibold w-1/3">{day.dayName}</p>
                      <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="icon" className="w-10 h-10" />
                      <p className="font-semibold w-1/3 text-right">
                        <span>{day.maxTemp}°</span>
                        <span className="text-gray-500 dark:text-gray-400"> / {day.minTemp}°</span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* === RÉSZLETES ADATOK === */}
              <section>
                 <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">Részletek</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                   <div className="flex items-center"><WiRaindrop className="text-3xl text-blue-500 mr-2" /> <span>Csapadék: <strong>{Math.round(processedData.now.pop * 100)}%</strong></span></div>
                   <div className="flex items-center"><WiHumidity className="text-3xl text-cyan-500 mr-2" /> <span>Páratartalom: <strong>{processedData.now.main.humidity}%</strong></span></div>
                   <div className="flex items-center"><WiStrongWind className="text-3xl text-gray-500 mr-2" /> <span>Szél: <strong>{Math.round(processedData.now.wind.speed * 3.6)} km/h</strong></span></div>
                   <div className="flex items-center"><WiSunrise className="text-3xl text-yellow-500 mr-2" /> <span>Napkelte: <strong>{format(new Date(processedData.city.sunrise * 1000), 'HH:mm')}</strong></span></div>
                   <div className="flex items-center"><WiSunset className="text-3xl text-orange-500 mr-2" /> <span>Napnyugta: <strong>{format(new Date(processedData.city.sunset * 1000), 'HH:mm')}</strong></span></div>
                 </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
