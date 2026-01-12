import React from 'react';
import { IoShieldCheckmarkOutline, IoLockClosedOutline, IoPersonOutline, IoServerOutline } from 'react-icons/io5';

export default function Adatvedelem() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-zinc-100 dark:border-zinc-800">

          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-indigo-500/20">
              <IoShieldCheckmarkOutline />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
              Adatkezelési Tájékoztató
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Utolsó frissítés: 2026. január 12.
            </p>
          </div>

          <div className="space-y-10 text-zinc-700 dark:text-zinc-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoPersonOutline className="text-indigo-500" />
                1. Bevezetés és Adatkezelő
              </h2>
              <p>
                A <strong>KőszegAPP</strong> (továbbiakban: Szolgáltató) elkötelezett a felhasználók személyes adatainak védelme iránt. Jelen tájékoztató célja, hogy világosan és átláthatóan rögzítse, milyen adatokat gyűjtünk, hogyan használjuk azokat, és milyen jogai vannak a felhasználóknak.
              </p>
              <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700">
                <strong>Adatkezelő:</strong> KőszegAPP fejlesztői csapata<br />
                <strong>Kapcsolat:</strong> koszegapp@gmail.com<br />
                <strong>Weboldal:</strong> visitkoszeg.hu / koszegapp.hu
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoLockClosedOutline className="text-indigo-500" />
                2. A kezelt adatok köre
              </h2>
              <p className="mb-4">
                A szolgáltatás igénybevételéhez (pl. időpontfoglalás) bizonyos személyes adatok megadása szükséges.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Regisztrációs adatok:</strong> Név, E-mail cím, Profilkép (Google/Apple fiókból átvéve).</li>
                <li><strong>Foglalási adatok:</strong> Foglalás időpontja, választott szolgáltató, megjegyzések.</li>
                <li><strong>Technikai adatok:</strong> IP-cím, böngésző típusa, eszköz típusa (biztonsági és statisztikai célokból).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoServerOutline className="text-indigo-500" />
                3. Az adatkezelés célja és jogalapja
              </h2>
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold">
                    <tr>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-700">Cél</th>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-700">Jogalap</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="p-4">Felhasználó azonosítása</td>
                      <td className="p-4">Az Érintett hozzájárulása</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="p-4">Időpontfoglalás biztosítása</td>
                      <td className="p-4">Szerződés teljesítése</td>
                    </tr>
                    <tr>
                      <td className="p-4">Kapcsolattartás (értesítések)</td>
                      <td className="p-4">Jogos érdek</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                4. Adatfeldolgozók és adattárolás
              </h2>
              <p className="mb-4">
                Az Ön adatait biztonságos szervereken tároljuk. Harmadik félnek csak a szolgáltatás működéséhez feltétlenül szükséges mértékben továbbítjuk.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span><strong>Supabase Inc.</strong> (Adatbázis szolgáltatás, USA/EU) - Az adatok titkosítva tárolódnak.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span><strong>Vercel / Netlify</strong> (Hosting szolgáltatás) - A webes felület kiszolgálása.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span><strong>Google / Apple</strong> (Autentikáció) - Bejelentkezési folyamat kezelése.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                5. Az Ön jogai
              </h2>
              <p className="mb-4">
                A GDPR (Általános Adatvédelmi Rendelet) értelmében Ön bármikor:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <strong>Tárolt adatok kikérése</strong>
                  <p className="text-sm mt-1 opacity-70">Megtudhatja, milyen adatokat tárolunk Önről.</p>
                </li>
                <li className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <strong>Adatok törlése</strong>
                  <p className="text-sm mt-1 opacity-70">Kérésére véglegesen töröljük fiókját és adatait.</p>
                </li>
                <li className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <strong>Helyesbítés</strong>
                  <p className="text-sm mt-1 opacity-70">Jelezheti, ha valamely adata pontatlan.</p>
                </li>
                <li className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <strong>Hozzájárulás visszavonása</strong>
                  <p className="text-sm mt-1 opacity-70">Bármikor visszavonhatja hozzájárulását az adatkezeléshez.</p>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                6. Kapcsolat
              </h2>
              <p>
                Amennyiben adatvédelmi kérdése van, vagy élni szeretne jogaival, kérjük lépjen kapcsolatba velünk az alábbi email címen:
              </p>
              <a href="mailto:koszegapp@gmail.com" className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-lg">
                koszegapp@gmail.com
              </a>
            </section>

          </div>
        </div>

        <div className="text-center mt-8 text-zinc-400 text-sm">
          &copy; 2026 KőszegAPP. Minden jog fenntartva.
        </div>
      </div>
    </div>
  );
}
