import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IoSend, IoArrowBack, IoLocateOutline, IoSparkles } from 'react-icons/io5';

// KőszegAI – szituációs, adat-földelt chatbot felülete.
// A /.netlify/functions/koszeg-chat végpontot hívja (Claude Sonnet 5).
// Küld GPS-kontextust; kezeli a strukturált profilt és a moderációs lezárást.

const ENDPOINT = '/.netlify/functions/koszeg-chat';

const GREETING = {
    role: 'assistant',
    content:
        'Jó napot kívánok! KőszegAI vagyok, a város kalauza – öröm a találkozás. 🎩\n' +
        'Mondja csak: kivel érkezik, mennyi ideje van, mihez volna kedve? Program, látnivaló, ' +
        'egy jó ebéd vagy épp egy legenda a régi falak közül – állok rendelkezésére.'
};

export default function KoszegChat() {
    const [messages, setMessages] = useState([GREETING]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ended, setEnded] = useState(false);
    const [profile, setProfile] = useState(null);
    const [coords, setCoords] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // GPS opcionálisan (nem blokkol, ha elutasítják).
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, speed: pos.coords.speed || 0 }),
            () => { /* csendes elutasítás */ },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
    }, []);

    // Görgetés az aljára új üzenetnél.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading || ended) return;

        const userMsg = { role: 'user', content: text };
        const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: text,
                    conversationHistory: history,
                    context: coords ? { location: coords } : {}
                })
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'assistant', content: data.content || '…' }]);
            if (data.profile) setProfile(data.profile);
            if (data.ended) setEnded(true);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Elnézését kérem, épp nem érem el a szolgáltatást. Kérem, próbálja meg kicsit később.' }
            ]);
        } finally {
            setLoading(false);
            // Fókusz vissza az input mezőre (ha nincs lezárva).
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [input, loading, ended, messages, coords]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0C234B] text-white">
            {/* Fejléc */}
            <header className="shrink-0 border-b border-white/10 bg-[#0C234B]/95 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Vissza">
                        <IoArrowBack size={20} />
                    </Link>
                    <div className="w-10 h-10 rounded-full bg-[#C8AF64]/15 border border-[#C8AF64]/30 flex items-center justify-center text-xl">
                        🎩
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-black text-sm tracking-wide leading-tight">KőszegAI</h1>
                        <p className="text-[11px] text-blue-200/60 leading-tight">a város kalauza — mindig szolgálatára</p>
                    </div>
                    {coords && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-[#C8AF64]/70" title="Helyzet ismert">
                            <IoLocateOutline size={12} /> helyzet ismert
                        </span>
                    )}
                </div>
            </header>

            {/* Üzenetek */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#C8AF64]/15 border border-[#C8AF64]/25 flex items-center justify-center text-sm mr-2 mt-0.5">
                                    🎩
                                </div>
                            )}
                            <div
                                className={
                                    m.role === 'user'
                                        ? 'max-w-[80%] bg-[#C8AF64] text-[#0C234B] font-medium rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-line'
                                        : 'max-w-[85%] bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm whitespace-pre-line text-blue-50/90 leading-relaxed'
                                }
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-[#C8AF64]/15 border border-[#C8AF64]/25 flex items-center justify-center text-sm mr-2">
                                🎩
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8AF64]/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8AF64]/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8AF64]/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bemenet / lezárás */}
            <div className="shrink-0 border-t border-white/10 bg-[#0C234B]/95 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    {ended ? (
                        <div className="text-center py-2">
                            <p className="text-xs text-blue-200/60 mb-3">A beszélgetést lezártuk.</p>
                            <button
                                onClick={() => { setMessages([GREETING]); setEnded(false); setProfile(null); }}
                                className="inline-flex items-center gap-2 bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                            >
                                <IoSparkles size={16} /> Új beszélgetés
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                rows={1}
                                placeholder="Írjon nekem… pl. esős napon, gyerekekkel, mit ajánl?"
                                className="flex-1 resize-none max-h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-200/40 focus:outline-none focus:border-[#C8AF64]/40 transition-colors"
                            />
                            <button
                                onClick={send}
                                disabled={!input.trim() || loading}
                                className="shrink-0 w-12 h-12 rounded-2xl bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Küldés"
                            >
                                <IoSend size={18} />
                            </button>
                        </div>
                    )}
                    <p className="text-[10px] text-blue-200/35 text-center mt-2">
                        KőszegAI hibázhat — fontos részleteket érdemes ellenőrizni.
                    </p>
                </div>
            </div>
        </div>
    );
}
