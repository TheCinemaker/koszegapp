import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles, IoClose, IoSend, IoNavigate, IoChevronDown, IoCarOutline, IoBedOutline, IoTelescopeOutline, IoTicketOutline } from 'react-icons/io5';
import { AIOrchestratorContext } from '../contexts/AIOrchestratorContext';
import { LocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAppMode } from '../core/ContextEngine';
import { getUserContext, updateAppMode } from '../core/UserContextEngine';
import { inferMovement } from '../core/MovementEngine';
import { fetchEventById } from '../api';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const MOCK_RESPONSES = {
    default: { role: 'assistant', content: 'Szia! Miben segíthetek ma Kőszegen?', action: null },
    events: { role: 'assistant', content: 'Máris mutatom a közelgő eseményeket!', action: { type: 'navigate_to_events', params: {} } }
};

async function saveConversationToSupabase({ userId, userMessage, assistantMessage, context }) {
    try {
        const { error } = await supabase.from('ai_conversations').insert({
            user_id: userId || null,
            user_message: userMessage,
            assistant_message: assistantMessage?.content || '',
            action_type: assistantMessage?.action?.type || null,
            action_params: assistantMessage?.action?.params || null,
            intent: assistantMessage?.debug?.intent || null,
            mode: context?.mode || null,
            location_lat: context?.location?.lat || null,
            location_lng: context?.location?.lng || null,
            weather: context?.weather || null,
            movement: context?.movement || null,
            created_at: new Date().toISOString()
        });
        if (error) console.warn('Supabase mentési hiba:', error.message);
    } catch (err) {
        console.warn('Supabase mentés sikertelen:', err);
    }
}

const QUICK_ACTIONS = [
    { label: 'Programok', icon: IoTicketOutline, query: 'Milyen programok vannak?' },
    { label: 'Parkolás', icon: IoCarOutline, query: 'Hol parkolhatok?' },
    { label: 'Látnivalók', icon: IoTelescopeOutline, query: 'Mit nézzek meg Kőszegen?' },
    { label: 'Szállás', icon: IoBedOutline, query: 'Hol szállhatok meg?' },
];

export default function AIAssistant() {
    const { user, token } = useAuth();
    const { suggestion, acceptSuggestion, dismiss: dismissSuggestion, setLastDecision, userLocation, weather } = useContext(AIOrchestratorContext);
    const { location } = useContext(LocationContext);

    useEffect(() => {
        if (!location) return;
        updateAppMode(getAppMode(location));
    }, [location]);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionStatus, setActionStatus] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const handleSuggestionClick = () => {
        const activeSuggestion = acceptSuggestion();
        if (activeSuggestion) {
            setIsOpen(true);
            setMessages(prev => [...prev, { role: 'assistant', content: activeSuggestion.text, action: { type: activeSuggestion.action }, isProactive: true }]);
        }
    };

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 450);
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleNavigation = (action) => {
        if (!action) return;
        setActionStatus(action.type);
        setTimeout(() => {
            switch (action.type) {
                case 'navigate_to_home': navigate('/'); break;
                case 'navigate_to_events': navigate('/events'); break;
                case 'navigate_to_event_detail': navigate(`/events/${action.params?.id}`); break;
                case 'navigate_to_food':
                case 'navigate_to_tickets':
                case 'navigate_to_game':
                    toast("Ez a funkció hamarosan elérhető! 🚧"); break;
                case 'navigate_to_parking': navigate('/parking'); break;
                case 'navigate_to_parking_detail': navigate(`/parking/${action.params?.id}`); break;
                case 'navigate_to_attractions': navigate('/attractions'); break;
                case 'navigate_to_attraction_detail': navigate(`/attractions/${action.params?.id}`); break;
                case 'navigate_to_hotels': navigate('/hotels'); break;
                case 'navigate_to_hotel_detail': navigate(`/hotels/${action.params?.id}`); break;
                case 'navigate_to_leisure': navigate('/leisure'); break;
                case 'navigate_to_leisure_detail': navigate(`/leisure/${action.params?.id}`); break;
                case 'navigate_to_pass': navigate('/pass'); break;
                case 'navigate_to_info': navigate('/info'); break;
                case 'buy_parking_ticket':
                    navigate('/parking', { state: { licensePlate: action.params?.licensePlate || '', zone: action.params?.zone || '', carrier: action.params?.carrier || '', autoGPS: action.params?.useGPS || false } });
                    break;
                case 'call_emergency': window.location.href = 'tel:112'; break;
                case 'call_phone':
                    if (action.params?.number) window.location.href = `tel:${action.params.number}`; break;
                case 'add_to_wallet':
                    if (action.params?.eventId) {
                        const toastId = toast.loading("Wallet Pass készítése...");
                        fetchEventById(action.params.eventId).then(async (evt) => {
                            if (!evt) throw new Error('Esemény nem található');
                            const res = await fetch('/.netlify/functions/create-event-pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evt) });
                            if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Hiba'); }
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = Object.assign(document.createElement('a'), { href: url, download: `event-${evt.id}.pkpass` });
                            document.body.appendChild(a); a.click(); a.remove();
                            window.URL.revokeObjectURL(url);
                            toast.success("Hozzáadva a Wallet-hez!", { id: toastId });
                        }).catch(err => toast.error(`Hiba: ${err.message}`, { id: toastId }));
                    }
                    break;
                case 'save_license_plate':
                    if (action.params?.licensePlate && user?.id) {
                        toast.promise(
                            import('../lib/supabaseClient').then(({ supabase }) =>
                                supabase.from('koszegpass_users').update({ license_plate: action.params.licensePlate }).eq('id', user.id)
                            ),
                            { loading: 'Mentés...', success: 'Rendszám elmentve! ✅', error: 'Hiba.' }
                        );
                    }
                    break;
                case 'open_external_map':
                    if (action.params?.lat && action.params?.lng)
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${action.params.lat},${action.params.lng}`, '_blank');
                    break;
                default: console.warn('Unknown action:', action.type);
            }
            setActionStatus(null);
        }, 700);
    };

    const sendMessage = async (overrideText) => {
        const text = overrideText || input;
        if (!text.trim() || loading) return;
        const userCtx = getUserContext();
        const currentInput = text;
        setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
        setInput('');
        setLoading(true);

        const requestContext = {
            userId: user?.id, authToken: token,
            mode: getAppMode(location),
            location: userLocation || location,
            distanceToMainSquare: userLocation?.distanceToMainSquare,
            weather, speed: userCtx.speed,
            movement: inferMovement(userCtx.speed),
            lastPage: userCtx.lastPage, timeOnPage: userCtx.timeOnPage, lastSearch: userCtx.lastSearch
        };

        try {
            const response = await fetch('/.netlify/functions/ai-assistant', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: currentInput, conversationHistory: messages, context: requestContext }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessages(prev => [...prev, data]);
                await saveConversationToSupabase({ userId: user?.id, userMessage: currentInput, assistantMessage: data, context: requestContext });
                if (data.debug?.intent) {
                    const i = data.debug.intent;
                    if (['events', 'accommodation', 'general_info', 'planning'].includes(i))
                        import('../ai/BehaviorEngine').then(({ setTravelIntent }) => setTravelIntent(true));
                }
                if (data.action) handleNavigation(data.action);
                if (data.debug || data.action)
                    setLastDecision({ intent: data.debug?.intent || 'unknown', action: data.action, score: data.debug?.score, timestamp: new Date().toISOString(), ...data.debug });
            } else throw new Error('Backend failed');
        } catch (err) {
            console.warn('AI Backend Error (mock):', err);
            setTimeout(async () => {
                const mock = currentInput.toLowerCase().includes('program') || currentInput.toLowerCase().includes('esemény')
                    ? MOCK_RESPONSES.events : MOCK_RESPONSES.default;
                setMessages(prev => [...prev, mock]);
                await saveConversationToSupabase({ userId: user?.id, userMessage: currentInput, assistantMessage: mock, context: requestContext });
                if (mock.action) handleNavigation(mock.action);
                setLoading(false);
            }, 900);
            return;
        }
        setLoading(false);
    };

    return (
        <>
            {/* ── Suggestion Bubble ── */}
            <AnimatePresence>
                {suggestion && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 14, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={handleSuggestionClick}
                        className="fixed bottom-24 right-4 z-[9990] max-w-[260px] cursor-pointer"
                    >
                        <div className="
                            bg-white/40 dark:bg-[#1a1c2e]/50
                            backdrop-blur-[25px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
                            border border-white/50 dark:border-white/20
                            shadow-[0_10px_40px_rgba(0,0,0,0.12)]
                            p-3.5 rounded-[1.4rem]
                            flex items-center gap-3
                        ">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md">
                                <IoSparkles className="text-white text-xs" />
                            </div>
                            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100 leading-snug flex-1">{suggestion.text}</p>
                            <button onClick={(e) => { e.stopPropagation(); dismissSuggestion(); }}
                                className="w-5 h-5 rounded-full bg-black/8 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                                <IoClose size={11} />
                            </button>
                        </div>
                        <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white/40 dark:bg-[#1a1c2e]/50 border-r border-b border-white/50 dark:border-white/20 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB ── */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-[72px] right-4 z-[9998] w-12 h-12 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-indigo-500 to-purple-600
                    border border-white/20
                    shadow-[0_4px_20px_rgba(99,102,241,0.45)]"
                whileTap={{ scale: 0.9 }}
                animate={suggestion && !isOpen ? {
                    scale: [1, 1.1, 1],
                    boxShadow: ['0 4px 20px rgba(99,102,241,0.4)', '0 4px 28px rgba(99,102,241,0.75)', '0 4px 20px rgba(99,102,241,0.4)'],
                    transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
                } : { scale: 1 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isOpen ? 'close' : 'open'}
                        initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                        {isOpen ? <IoChevronDown className="text-white text-xl" /> : <IoSparkles className="text-white text-lg" />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>

            {/* ── Backdrop ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[9995] bg-black/25 backdrop-blur-[2px]"
                    />
                )}
            </AnimatePresence>

            {/* ── Sheet ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.9 }}
                        className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col overflow-hidden"
                        style={{
                            height: 'calc(100dvh - 64px)',
                            borderRadius: '28px 28px 0 0',
                            background: 'rgba(255,255,255,0.42)',
                            backdropFilter: 'blur(40px) saturate(180%) brightness(1.08)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.08)',
                            borderTop: '1px solid rgba(255,255,255,0.55)',
                            boxShadow: '0 -1px 0 rgba(255,255,255,0.5), 0 -24px 60px rgba(0,0,0,0.13)',
                        }}
                    >
                        {/* dark tint */}
                        <div className="absolute inset-0 dark:bg-[#1a1c2e]/72 pointer-events-none" style={{ borderRadius: 'inherit' }} />
                        {/* gradient top lip — matches header */}
                        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-60 z-10" />

                        {/* Drag handle */}
                        <div className="relative z-10 flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-9 h-1 rounded-full bg-black/15 dark:bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_12px_rgba(99,102,241,0.4)]">
                                    <IoSparkles className="text-white text-sm" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight">Kőszeg</span>
                                        <span className="text-[15px] font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-black/6 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-black/10 active:scale-90 transition-all">
                                <IoClose size={15} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative z-10 h-px mx-5 bg-black/5 dark:bg-white/8 shrink-0" />

                        {/* Messages area */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>

                            {/* Empty state */}
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 28 }}
                                    className="flex flex-col items-center justify-center h-full text-center pb-8"
                                >
                                    <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4 shadow-inner">
                                        <IoSparkles className="text-2xl text-indigo-500" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight mb-1">
                                        Szia, én vagyok <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">KőszegAI</span>!
                                    </h3>
                                    <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-[210px] leading-relaxed mb-6">
                                        Kérdezz bármit a városról, segítek!
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 w-full max-w-[288px]">
                                        {QUICK_ACTIONS.map((action, i) => (
                                            <motion.button
                                                key={action.label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.22 + i * 0.07, type: 'spring', stiffness: 320, damping: 26 }}
                                                onClick={() => sendMessage(action.query)}
                                                className="
                                                    flex items-center gap-2.5 px-3.5 py-3
                                                    bg-white/50 dark:bg-white/6
                                                    backdrop-blur-md
                                                    rounded-2xl
                                                    border border-white/60 dark:border-white/10
                                                    shadow-sm hover:shadow-md
                                                    hover:bg-white/70 dark:hover:bg-white/10
                                                    active:scale-95
                                                    transition-all duration-200 text-left
                                                "
                                            >
                                                <action.icon className="text-indigo-500 dark:text-indigo-400 text-lg shrink-0" />
                                                <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{action.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Bubbles */}
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                                            <IoSparkles className="text-white text-[9px]" />
                                        </div>
                                    )}
                                    <div className={`max-w-[78%] px-4 py-2.5 text-[14px] leading-relaxed ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[18px] rounded-br-[4px] shadow-[0_2px_12px_rgba(99,102,241,0.35)]'
                                            : 'bg-white/60 dark:bg-white/8 backdrop-blur-sm text-gray-800 dark:text-gray-100 rounded-[18px] rounded-bl-[4px] border border-white/60 dark:border-white/10 shadow-sm'
                                        }`}>
                                        {msg.content}
                                        {msg.action?.type && (
                                            <div className="mt-1.5 pt-1.5 border-t border-white/20 dark:border-white/10 text-[11px] opacity-55 flex items-center gap-1">
                                                <IoNavigate size={10} /><span>Megnyitás...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing */}
                            {loading && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                        <IoSparkles className="text-white text-[9px]" />
                                    </div>
                                    <div className="bg-white/60 dark:bg-white/8 backdrop-blur-sm border border-white/60 dark:border-white/10 px-4 py-3 rounded-[18px] rounded-bl-[4px] shadow-sm flex gap-1.5 items-center">
                                        {[0, 0.16, 0.32].map((delay, i) => (
                                            <motion.div key={i}
                                                animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay, ease: 'easeInOut' }}
                                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Action pill */}
                            <AnimatePresence>
                                {actionStatus && (
                                    <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} className="flex justify-center">
                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/70 dark:bg-white/15 backdrop-blur-md text-white text-[12px] font-medium shadow-lg border border-white/10">
                                            <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Megnyitás...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar */}
                        <div
                            className="relative z-10 px-4 shrink-0"
                            style={{
                                paddingTop: '10px',
                                paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
                                borderTop: '1px solid rgba(255,255,255,0.28)',
                                background: 'rgba(255,255,255,0.28)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }}
                        >
                            <div className="absolute inset-0 dark:bg-[#1a1c2e]/50 pointer-events-none" />
                            <div className="relative flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    placeholder="Kérdezz valamit..."
                                    disabled={loading}
                                    style={{ fontSize: '16px' }}
                                    className="
                                        flex-1 px-4 py-3
                                        bg-white/50 dark:bg-white/8
                                        backdrop-blur-sm
                                        rounded-2xl
                                        text-gray-900 dark:text-white
                                        placeholder-gray-400 dark:placeholder-gray-500
                                        border border-white/60 dark:border-white/10
                                        focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                                        transition-all duration-200
                                        disabled:opacity-50
                                    "
                                />
                                <motion.button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    whileTap={{ scale: 0.88 }}
                                    className="
                                        w-11 h-11 rounded-full shrink-0
                                        bg-gradient-to-br from-indigo-500 to-purple-600
                                        disabled:from-gray-200 disabled:to-gray-300
                                        dark:disabled:from-white/10 dark:disabled:to-white/5
                                        flex items-center justify-center
                                        shadow-[0_2px_12px_rgba(99,102,241,0.4)]
                                        disabled:shadow-none
                                        transition-all duration-200
                                    "
                                >
                                    <IoSend className="text-white text-sm ml-0.5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
