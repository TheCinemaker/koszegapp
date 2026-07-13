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
        <div className="min-h-screen bg-[#0C234B] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <Link
                            to="/pass"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-10 h-10"
                        >
                            <IoArrowBack size={20} />
                        </Link>
                        <h2 className="text-[#C8AF64] font-black text-sm uppercase tracking-widest flex items-center gap-1.5">
                            <IoSparkles className="text-yellow-400" /> Kártya megkeresése
                        </h2>
                        <div className="w-10 h-10" />
                    </div>

                    {sent ? (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <IoCheckmarkCircle className="text-5xl text-green-400" />
                            </div>
                            <h1 className="text-xl font-black text-white mb-2">Nézd meg a postafiókod! 📬</h1>
                            <p className="text-blue-200/60 text-sm leading-relaxed mb-8">
                                Ha van érvényes KőszegPass a(z) <strong className="text-white break-all">{email.trim()}</strong> címhez,
                                elküldtük rá a kártya megnyitásához szükséges linket. Nézd meg a spam mappát is, ha nem látod pár percen belül.
                            </p>
                            <Link
                                to="/pass"
                                className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm"
                            >
                                Vissza a kezdőlapra
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-[#C8AF64]/10 border border-[#C8AF64]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <IoMailOutline className="text-3xl text-[#C8AF64]" />
                                </div>
                                <h1 className="text-xl font-black text-white mb-2">Elveszett a kártyád linkje?</h1>
                                <p className="text-blue-200/60 text-sm leading-relaxed">
                                    Add meg a vásárláskor használt e-mail címed, és visszaküldjük rá a személyes
                                    KőszegPass linkedet. Nincs szükség jelszóra.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-200/50 mb-2 ml-1">
                                        E-mail cím
                                    </label>
                                    <input
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="pl. te@email.hu"
                                        className="w-full bg-black/25 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-[#C8AF64]/60 transition-all"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] font-black h-12 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
