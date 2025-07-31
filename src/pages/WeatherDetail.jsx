import React from 'react';

export default function WeatherDetail() {
  return (
    <div className="max-w-3xl mx-auto my-6 p-4 bg-white/20 dark:bg-gray-800 backdrop-blur-md rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Időjárás Előrejelzés</h1>
        <a 
          href="https://www.facebook.com/idojaraskoszeg.hu" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition"
        >
          Megnyitás Facebookon
        </a>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        A legfrissebb bejegyzések Ráduly László hivatalos Facebook oldaláról. A tartalom betöltése pár másodpercet igénybe vehet.
      </p>
      
      {/* === ITT A JAVÍTÁS === */}
      {/* 
        A külső div egy "maszk", ami levágja a felesleget, és beállítja a magasságot.
        A belső div-et és az iframe-et pedig lekicsinyítjük.
      */}
      <div className="w-full h-[80vh] min-h-[600px] rounded-lg shadow-inner bg-gray-200 dark:bg-gray-900 overflow-hidden">
        <div 
          className="transform origin-top-left"
          style={{ 
            // A 2/3-ad kb. 66.67%. A scale(0.6667) lekicsinyíti a tartalmat.
            // Ahhoz, hogy a keretet kitöltse, a szélességet és magasságot meg kell növelni 1/0.6667 = 1.5 arányban.
            // 100% * 1.5 = 150%.
            width: '150%',
            height: '150%',
            transform: 'scale(0.6667)',
            transformOrigin: '0 0'
          }}
        >
          <iframe 
            title="Kőszegi Időjárás Előrejelzés"
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fidojaraskoszeg.hu&tabs=timeline&width=500&height=1000&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false" 
            width="100%" 
            height="100%" 
            style={{ border:'none', overflow:'hidden' }}
            scrolling="no" 
            frameBorder="0" 
            allowFullScreen={true} 
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
