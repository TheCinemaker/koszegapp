import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IoArrowBack, IoMailOutline, IoCheckmarkCircle, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function PassLookup() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            toast.error('Adj meg egy érvényes e-mail címet.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/.netlify/functions/koszeg-pass-lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed })
            });
            // A backend anti-enumeráció miatt mindig generikus OK-t ad
            if (!res.ok) throw new Error('request failed');
            setSent(true);
        } catch (err) {
            console.error('Lookup error:', err);
            toast.error('Valami hiba történt. Próbáld újra kicsit később.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10">
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-[30px] rounded-3xl border border-white/60 dark:border-white/10 p-6 sm:p-8 shadow-lg">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <Link
                            to="/pass"
                            className="p-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm"
                        >
                            <IoArrowBack size={20} className="text-gray-600 dark:text-gray-300" />
                        </Link>
                        <h2 className="text-brand dark:text-brand-light font-black text-sm uppercase tracking-widest flex items-center gap-1.5">
                            <IoSparkles className="text-amber-400" /> Kártya megkeresése
                        </h2>
                        <div className="w-10 h-10" />
                    </div>

                    {sent ? (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <IoCheckmarkCircle className="text-5xl text-emerald-400" />
                            </div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">Nézd meg a postafiókod! 📬</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                                Ha van érvényes KőszegPass a(z) <strong className="text-brand dark:text-brand-light break-all">{email.trim()}</strong> címhez,
                                elküldtük rá a kártya megnyitásához szükséges linket. Nézd meg a spam mappát is, ha nem látod pár percen belül.
                            </p>
                            <Link
                                to="/pass"
                                className="inline-block bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-all text-sm"
                            >
                                Vissza a kezdőlapra
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-brand/10 dark:bg-indigo-500/10 border border-brand/30 dark:border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                                    <IoMailOutline className="text-3xl text-brand dark:text-indigo-400" />
                                </div>
                                <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">Elveszett a kártyád linkje?</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    Add meg a vásárláskor használt e-mail címed, és visszaküldjük rá a személyes
                                    KőszegPass linkedet. Nincs szükség jelszóra.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">
                                        E-mail cím
                                    </label>
                                    <input
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="pl. te@email.hu"
                                        className="w-full bg-white/50 dark:bg-black/25 border border-white/40 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-indigo-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-brand dark:bg-indigo-500 hover:opacity-90 text-white font-black h-12 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                                >
                                    {submitting ? 'Küldés...' : 'Küldjétek el a linket'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
