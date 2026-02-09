import React from 'react';
import { IoShieldCheckmarkOutline, IoLockClosedOutline, IoPersonOutline, IoServerOutline, IoWarningOutline } from 'react-icons/io5';

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
              Hatályos: 2026. február 12. napjától
            </p>
          </div>

          <div className="space-y-10 text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-2xl flex gap-4 items-start">
              <IoWarningOutline className="text-3xl text-amber-600 dark:text-amber-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Röviden és tömören</h3>
                <p className="text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                  A KőszegApp használata során bizonyos adatokat (pl. vásárlások, pontok, jegyek) tárolnunk kell a működéshez.
                  <strong> Ezen adatokat SOHA nem adjuk el harmadik félnek marketing célokra.</strong>
                  Kizárólag törvényi kötelezettség esetén (pl. rendőrségi vagy bírósági megkeresés) adjuk ki azokat az arra jogosult hatóságoknak.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoPersonOutline className="text-indigo-500" />
                1. Milyen adatokat kezelünk?
              </h2>
              <p className="mb-4 text-sm">
                A rendszer megfelelő működéséhez (jegyek, hűségpontok, fizetés) az alábbi adatokat tároljuk biztonságos adatbázisunkban:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Azonosítás:</strong> Email cím, név, profilkép (Google/Apple bejelentkezés esetén), User ID.</li>
                <li><strong>Tranzakciók:</strong> Vásárolt jegyek típusa, érvényessége, vásárlás időpontja.</li>
                <li><strong>Hűségpontok:</strong> KőszegPass egyenleg, pontgyűjtés és beváltás története.</li>
                <li><strong>Pénzügyi adatok:</strong> A Stripe fizetési rendszer által generált tranzakció-azonosítók (bankkártya adatokat MI NEM tárolunk, azt kizárólag a Stripe kezeli).</li>
                <li><strong>Játék státusz:</strong> Megszerzett kincsek, teljesített rejtvények.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoServerOutline className="text-indigo-500" />
                2. Hol és hogyan tároljuk az adatokat?
              </h2>
              <p className="mb-4 text-sm">
                Az adatok tárolása az iparági sztenderdeknek megfelelő, titkosított adatbázisban történik.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0"></span>
                  <div>
                    <strong>Supabase Inc. (Adatbázis):</strong>
                    <p className="opacity-70 mt-1">Minden felhasználói adat itt tárolódik titkosított formában. A szerverek az Európai Unió adatvédelmi szabályainak (GDPR) megfelelnek.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></span>
                  <div>
                    <strong>Stripe (Fizetés):</strong>
                    <p className="opacity-70 mt-1">A bankkártyás fizetéseket a Stripe nemzetközi rendszere kezeli. Mi csak a sikeres fizetés tényéről kapunk értesítést.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <IoLockClosedOutline className="text-indigo-500" />
                3. Adattovábbítás és Harmadik felek
              </h2>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Zéró Tolerancia elvünk:</h4>
                <p className="mb-4 text-sm">
                  A rendszerünkben keletkező adatokat <strong>NEM adjuk át, nem adjuk el, és nem tesszük hozzáférhetővé</strong> semmilyen marketing cégnek, hirdetőnek vagy egyéb magánvállalkozásnak.
                </p>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Kivételek (Jogi kötelezettség):</h4>
                <p className="text-sm">
                  Kizárólag abban az esetben adunk ki adatot, ha erre <strong>törvény kötelez minket</strong>, és hivatalos megkeresést kapunk az alábbi szervektől:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm opacity-80">
                  <li>Rendőrség / Nyomozó hatóságok</li>
                  <li>Bíróság</li>
                  <li>Nemzeti Adó- és Vámhivatal (NAV) - a számlázási adatok tekintetében</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                4. Az Ön jogai (GDPR)
              </h2>
              <p className="mb-4 text-sm">
                Ön a nap 24 órájában jogosult:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <li className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                  <strong>Adatainak megtekintésére</strong>
                  <p className="mt-1 opacity-70">Az applikációban (Profil) vagy kérésre emailben.</p>
                </li>
                <li className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                  <strong>Adatainak törlésére</strong>
                  <p className="mt-1 opacity-70">Emailben kérheti fiókja és minden adata végleges törlését (kivéve a számviteli törvény által kötelezően megőrzendő számlaadatokat).</p>
                </li>
              </ul>
            </section>

            <section className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <p className="text-sm text-center">
                Adatkezeléssel kapcsolatos kérdés, kérés vagy törlési igény esetén írjon nekünk:
                <br />
                <a href="mailto:koszegapp@gmail.com" className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  koszegapp@gmail.com
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
