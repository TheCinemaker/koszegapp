import React from 'react';

export default function Adatvedelem() {
  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-4">Adatkezelési tájékoztató</h1>
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
        Utolsó frissítés: 2025.07.16.
      </p>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">Ki az adatkezelő?</h2>
      <p className="mb-4">
        A weboldal üzemeltetője: KőszegAPP (visitkoszeg.hu, koszegapp.hu)
        <br/>
        Email: koszegapp@gmail.com
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Milyen adatokat gyűjtünk?</h2>
      <p className="mb-4">
        A honlap nem gyűjt személyes adatokat, nem kér regisztrációt, nem használ kapcsolatfelvételi űrlapot.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Sütik (cookie-k)</h2>
      <p className="mb-4">
        Az oldal csak a működéshez és statisztikához szükséges sütiket használ:
        Google Analytics 4, anonim módon, IP-cím anonimizálással.
        Nincs remarketing, nincs profilozás.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Jogok</h2>
      <p className="mb-4">
        Jogod van tájékoztatást kérni az adatkezelésről, kérni helyesbítést vagy törlést,
        illetve panaszt tenni a lakóhely szerinti felügyeleti hatóságnál.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">További információ</h2>
      <p>
        Kérdés esetén írj nekünk: koszegapp@gmail.com Minden jog fenntartva!
      </p>
    </div>
  );
}
