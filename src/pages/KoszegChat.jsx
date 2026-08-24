import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IoSend, IoArrowBack, IoLocateOutline, IoSparkles } from 'react-icons/io5';

// KőszegAI – szituációs, adat-földelt chatbot felülete.
// A /.netlify/functions/koszeg-chat végpontot hívja (Claude Sonnet 5).
// Küld GPS-kontextust; kezeli a strukturált profilt és a moderációs lezárást.

const ENDPOINT = '/.netlify/functions/koszeg-chat';
const LS_MESSAGES = 'koszegai_messages';
const LS_PROFILE = 'koszegai_profile';

const GREETING = {
    role: 'assistant',
    content:
        'Szervusz! Dimitryj vagyok, Kőszeg kalauza – öröm, hogy itt vagy. 🎩\n' +
        'Mondd csak: kivel jöttél, mennyi időd van, mihez volna kedved? Program, látnivaló, ' +
        'egy jó ebéd vagy épp egy legenda a régi falak közül – állok rendelkezésedre.'
};

// Tartós memória: a korábbi beszélgetés + a strukturált profil localStorage-ban.
// A profilt visszaküldjük a szervernek, így a robot akkor is "emlékszik, kivel
// beszél", ha az appot bezárták és újranyitották ugyanazon a telefonon.
function loadMessages() {
    try {
        const raw = localStorage.getItem(LS_MESSAGES);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length) return arr;
    } catch { /* korrupt/nincs → alap */ }
    return [GREETING];
}
function loadProfile() {
    try {
        const raw = localStorage.getItem(LS_PROFILE);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export default function KoszegChat() {
    const [messages, setMessages] = useState(loadMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ended, setEnded] = useState(false);
    const [profile, setProfile] = useState(loadProfile);
    const [coords, setCoords] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Mentés localStorage-ba (utolsó ~24 üzenet, hogy ne hízzon vég nélkül).
    useEffect(() => {
        try { localStorage.setItem(LS_MESSAGES, JSON.stringify(messages.slice(-24))); } catch { /* pl. tele/priv mód */ }
    }, [messages]);
    useEffect(() => {
        try { if (profile) localStorage.setItem(LS_PROFILE, JSON.stringify(profile)); } catch { /* ignore */ }
    }, [profile]);

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
                    // A tartós memória a profil; a nyers előzményből elég az utolsó pár üzenet.
                    conversationHistory: history.slice(-12),
                    context: coords ? { location: coords } : {},
                    knownProfile: profile || null
                })
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'assistant', content: data.content || '…' }]);
            if (data.profile) setProfile(data.profile);
            if (data.ended) setEnded(true);
        } catch (err) {
            console.error('[KoszegChat] Hiba történt:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Elnézést, épp nem érem el a szolgáltatást. Kérlek, próbáld meg kicsit később.' }
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
        <div className="h-[calc(100dvh-170px)] mt-2 mx-3 flex flex-col overflow-hidden bg-brand text-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gold/30">
            {/* Fejléc */}
            <header className="shrink-0 border-b border-gold/20 bg-brand/95 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Vissza">
                        <IoArrowBack size={20} />
                    </Link>
                    <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-xl">
                        🎩
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-black text-sm tracking-wide leading-tight text-gold-light">Dimitryj</h1>
                        <p className="text-[11px] text-gold-light/60 leading-tight">Kőszeg kalauza · béta</p>
                    </div>
                    {coords && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-gold-light/70" title="Helyzet ismert">
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
                                <div className="w-8 h-8 shrink-0 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-sm mr-2 mt-0.5">
                                    🎩
                                </div>
                            )}
                            <div
                                className={
                                    m.role === 'user'
                                        ? 'max-w-[80%] bg-brand border border-gold/40 text-white font-medium rounded-[18px] rounded-br-[4px] px-4 py-2.5 text-sm whitespace-pre-line shadow-card'
                                        : 'max-w-[85%] bg-white/10 border border-white/20 rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-sm whitespace-pre-line text-white leading-relaxed shadow-sm'
                                }
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-sm mr-2">
                                🎩
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-[18px] rounded-bl-[4px] px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bemenet / lezárás */}
            <div className="shrink-0 border-t border-gold/20 bg-brand/95 backdrop-blur-xl pb-3">
                <div className="max-w-2xl mx-auto px-4 pt-3">
                    {ended ? (
                        <div className="text-center py-2">
                            <p className="text-xs text-gold-light/60 mb-3">A beszélgetést lezártuk.</p>
                            <button
                                onClick={() => {
                                    setMessages([GREETING]);
                                    setEnded(false);
                                    setProfile(null);
                                    try { localStorage.removeItem(LS_MESSAGES); localStorage.removeItem(LS_PROFILE); } catch { /* ignore */ }
                                }}
                                className="inline-flex items-center gap-2 bg-brand border border-gold/40 hover:bg-gold/20 text-gold-light font-bold px-5 py-2.5 rounded-[18px] text-sm transition-colors shadow-card"
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
                                className="flex-1 resize-none max-h-32 bg-white/10 border border-gold/30 rounded-[18px] px-4 py-3 text-sm text-white placeholder-gold-light/40 focus:outline-none focus:border-gold/60 transition-colors shadow-inner"
                            />
                            <button
                                onClick={send}
                                disabled={!input.trim() || loading}
                                className="shrink-0 w-12 h-12 rounded-full bg-brand border border-gold/40 hover:bg-gold/20 text-gold-light flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
                                aria-label="Küldés"
                            >
                                <IoSend size={18} />
                            </button>
                        </div>
                    )}
                    <p className="text-[10px] text-gold-light/40 text-center mt-2">
                        Dimitryj hibázhat — fontos részleteket érdemes ellenőrizni.
                    </p>
                </div>
            </div>
        </div>
    );
}
