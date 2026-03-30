import React from 'react';
import { motion } from 'framer-motion';
import { IoArrowBack, IoReaderOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

export default function TermsProvider() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <IoArrowBack /> Vissza a regisztrációhoz
                </button>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 shadow-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 text-3xl">
                            <IoReaderOutline />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Szolgáltatói Szerződés</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Általános Szerződési Feltételek Partnerek részére</p>
                        </div>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">1. A Szolgáltatás Tárgya</h2>
                            <p>
                                A KőszegAPP felületet biztosít helyi szolgáltatók részére, hogy szolgáltatásaikat közzétegyék, és az ügyfelek részére online időpontfoglalást tegyenek lehetővé.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">2. Választható Csomagok</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Start Csomag:</strong> Szoftveres hozzáférés a foglalási rendszerhez, admin felület, statisztikák.</li>
                                <li><strong>Prémium Csomag:</strong> Szoftveres hozzáférés + 10" professzionális táblagép a helyszíni kezeléshez.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">3. Díjazás és Aktiválás</h2>
                            <p>
                                A szolgáltatás igénybevétele díjköteles. A pontos díjakról és a fizetési feltételekről a regisztrációt követő 24 órán belül munkatársunk tájékoztatja Önt.
                                A fiók aktiválása a szerződés aláírása és az első havi/éves díj beérkezése után történik meg.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">4. Adatkezelés</h2>
                            <p>
                                A Szolgáltató tudomásul veszi, hogy az átadott adatokat (cégnév, telefonszám, cím) a KőszegAPP az üzemeltetés és az ügyfelek tájékoztatása céljából kezeli és közzéteszi.
                            </p>
                        </section>

                        <div className="p-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-2xl flex items-center justify-between mt-12">
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Kérdése van? Keressen minket bizalommal: <br />
                                <span className="font-bold">koszegapp@gmail.com</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
