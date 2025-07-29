import React, { useState, useEffect } from 'react';
import { hu } from 'date-fns/locale';
import { format } from 'date-fns';

// FONTOS: Az API kulcsot soha ne tedd ki a kódba! Használj .env fájlt!
// Pl.: const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const API_KEY = 'ebe4857b9813fcfd39e7ce692e491045'; 

export default function WeatherModal({ onClose }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ez egy másik API végpont, ami 5 napos, 3 órás bontású előrejelzést ad
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Koszeg,HU&units=metric&appid=${API_KEY}&lang=hu`)
      .then(res => res.json())
      .then(data => {
        // Csak az első 8 mérést vesszük (kb. 24 óra)
        setForecast(data.list.slice(0, 8));
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadein-fast">
      <div className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-11/12 max-w-md m-4">
        <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800 dark:hover:text-white">×</button>
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-4">Időjárás-előrejelzés</h2>
        
        {loading ? (
          <p>Előrejelzés betöltése...</p>
        ) : forecast ? (
          <div className="space-y-4">
            {forecast.map((period, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/30 dark:bg-gray-700/50">
                <div>
                  <p className="font-semibold">{format(new Date(period.dt * 1000), 'HH:mm')}</p>
                  <p className="text-sm capitalize">{period.weather[0].description}</p>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-lg mr-2">{Math.round(period.main.temp)}°C</span>
                  <img src={`https://openweathermap.org/img/wn/${period.weather[0].icon}.png`} alt={period.weather[0].description} className="w-10 h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Nem sikerült betölteni az előrejelzést.</p>
        )}
      </div>
    </div>
  );
}
