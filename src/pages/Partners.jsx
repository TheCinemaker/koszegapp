import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoArrowBack,
    IoRocketOutline,
    IoFlashOutline,
    IoWalletOutline,
    IoAnalyticsOutline,
    IoPeopleOutline,
    IoMailOutline,
    IoChevronForward
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

export default function Partners() {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: IoFlashOutline,
            title: 'Azonnali Megjelenés',
            desc: 'Eseményed percek alatt kikerül a visitkoszeg programajánlójába, ahol a leginkább érdekelt közönség látja.',
            color: 'bg-amber-500'
        },
        {
            icon: IoWalletOutline,
            title: 'Zéró Kockázat, Tiszta Siker',
            desc: 'Nincs havidíj vagy rejtett költség – mi csak akkor kérünk jutalékot, ha neked is bevételt hoztunk. Nincs veszítenivalód!',
            color: 'bg-emerald-500'
        },
        {
            icon: IoRocketOutline,
            title: 'Rugalmas Beléptetés',
            desc: 'Használd a saját mobilod a szkenneléshez, vagy bérelj tőlünk professzionális eszközöket a helyszíni jegykezeléshez – mi mindenre tudunk megoldást.',
            color: 'bg-indigo-500'
        },
        {
            icon: IoFlashOutline,
            title: 'Gondtalan Ügyintézés',
            desc: 'Felejtsd el a bonyolult adminisztrációt: mi mindent elvégzünk helyetted. Az esemény feltöltésétől a jegyek generálásáig minden automatikusan történik.',
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-32">
            {/* ATMOSPHERE */}
            <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>

            {/* HEADER */}
            <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
                <FadeUp>
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-12 w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:scale-105 transition-transform"
                    >
                        <IoArrowBack className="text-xl" />
                    </button>

                    <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                            Partnerségi Program
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                        A rendezvényed a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">város zsebében.</span>
                    </h1>

                    <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Hirdesd meg eseményed Kőszeg digitális központjában, és hagyd, hogy mi elvégezzük a jegyértékesítési munkát helyetted. Neked az egészhez csak egy mobiltelefonra van szükséged!
                    </p>
                </FadeUp>
            </div>

            {/* BENEFITS GRID */}
            <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 mb-32">
                {benefits.map((benefit, idx) => (
                    <FadeUp key={idx} delay={idx * 0.1}>
                        <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                            <div className={`w-14 h-14 rounded-2xl ${benefit.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg`}>
                                <benefit.icon className="text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {benefit.desc}
                            </p>
                        </div>
                    </FadeUp>
                ))}
            </section>

            {/* TECH HIGHLIGHT */}
            <section className="max-w-4xl mx-auto px-6 mb-32">
                <FadeUp className="relative overflow-hidden rounded-[3rem] bg-zinc-900 text-white p-12 md:p-20 text-center">
                    {/* Abstract background */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Korszerű technika, <br />zéró nehézség.</h2>
                        <p className="text-lg text-zinc-400 mb-12 max-w-xl mx-auto">
                            A visitkoszeg jegyrendszere nem csak jegyet ad: élményt nyújt. Apple Wallet és Google Wallet támogatás, QR-kódos PDF-ek és villámgyors mobil szkenner – mindezt extra beruházás nélkül.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                <IoPeopleOutline className="text-xl text-indigo-400" />
                                <span className="text-sm font-semibold text-zinc-300">Korlátlan terhelhetőség, 1mp-es validáció</span>
                            </div>
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                <IoFlashOutline className="text-xl text-amber-400" />
                                <span className="text-sm font-semibold text-zinc-300">Komplex automata háttérrendszer</span>
                            </div>
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                <IoRocketOutline className="text-xl text-emerald-400" />
                                <span className="text-sm font-semibold text-zinc-300">Nulla hardverigény – csak a mobilod</span>
                            </div>
                        </div>
                    </div>
                </FadeUp>
            </section>

            {/* CTA SECTION */}
            <section className="max-w-4xl mx-auto px-6 text-center">
                <FadeUp>
                    <h2 className="text-4xl font-bold mb-6">Vágjunk bele együtt!</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-12">
                        Készen állsz Kőszeg legmodernebb platformjára lépni? Írj nekünk, és akár 24 órán belül kikerülhet az eseményed.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a
                            href="mailto:koszegapp@gmail.com?subject=Partneri jelentkezés"
                            className="px-10 py-5 rounded-full bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2"
                        >
                            <IoMailOutline className="text-xl" />
                            Kapcsolatfelvétel
                        </a>
                        <button
                            disabled
                            className="px-10 py-5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 font-bold text-lg cursor-not-allowed flex items-center gap-2"
                        >
                            Jegyrendszer megtekintése (Hamarosan)
                            <IoChevronForward />
                        </button>
                    </div>
                </FadeUp>
            </section>
        </div>
    );
}
