import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { IoSparkles, IoClose, IoSend, IoNavigate, IoCalendar, IoChevronDown } from 'react-icons/io5';
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
    default: {
        role: 'assistant',
        content: 'Szia! Miben segíthetek ma Kőszegen?',
        action: null
    },
    events: {
        role: 'assistant',
        content: 'Máris mutatom a közelgő eseményeket!',
        action: { type: 'navigate_to_events', params: {} }
    }
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

// Quick action chips shown in empty state
const QUICK_ACTIONS = [
    { label: 'Programok', emoji: '🎭', query: 'Milyen programok vannak?' },
    { label: 'Parkolás', emoji: '🅿️', query: 'Hol parkolhatok?' },
    { label: 'Látnivalók', emoji: '🏰', query: 'Mit nézzek meg Kőszegen?' },
    { label: 'Szállás', emoji: '🛏️', query: 'Hol szállhatok meg?' },
];

export default function AIAssistant() {
    const { user, token } = useAuth();
    const { suggestion, acceptSuggestion, dismiss: dismissSuggestion, setLastDecision, userLocation, weather } = useContext(AIOrchestratorContext);
    const { location } = useContext(LocationContext);

    useEffect(() => {
        if (!location) return;
        const mode = getAppMode(location);
        updateAppMode(mode);
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
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: activeSuggestion.text, action: { type: activeSuggestion.action }, isProactive: true }
            ]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleNavigation = (action) => {
        if (!action) return;
        setActionStatus({ type: action.type, status: 'executing' });

        setTimeout(() => {
            switch (action.type) {
                case 'navigate_to_home': navigate('/'); break;
                case 'navigate_to_events': navigate('/events'); break;
                case 'navigate_to_event_detail': navigate(`/events/${action.params?.id}`); break;
                case 'navigate_to_food':
                case 'navigate_to_tickets':
                case 'navigate_to_game':
                    toast("Ez a funkció hamarosan elérhető lesz! 🚧");
                    break;
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
                    navigate('/parking', {
                        state: {
                            licensePlate: action.params?.licensePlate || '',
                            zone: action.params?.zone || '',
                            carrier: action.params?.carrier || '',
                            autoGPS: action.params?.useGPS || false
                        }
                    });
                    break;
                case 'call_emergency': window.location.href = 'tel:112'; break;
                case 'call_phone':
                    if (action.params?.number) window.location.href = `tel:${action.params.number}`;
                    break;
                case 'add_to_wallet':
                    if (action.params?.eventId) {
                        const eventId = action.params.eventId;
                        const toastId = toast.loading("Wallet Pass készítése...");
                        fetchEventById(eventId).then(async (evt) => {
                            if (!evt) throw new Error('Esemény nem található');
                            const res = await fetch('/.netlify/functions/create-event-pass', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(evt),
                            });
                            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Generálási hiba'); }
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `event-${evt.id}.pkpass`;
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
                            { loading: 'Rendszám mentése...', success: 'Rendszám elmentve! ✅', error: 'Hiba a mentés során.' }
                        );
                    }
                    break;
                case 'open_external_map':
                    if (action.params?.lat && action.params?.lng) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${action.params.lat},${action.params.lng}`, '_blank');
                    }
                    break;
                default: console.warn('Unknown action:', action.type); break;
            }
            setActionStatus(null);
        }, 800);
    };

    const sendMessage = async (overrideInput) => {
        const messageText = overrideInput || input;
        if (!messageText.trim() || loading) return;

        const userCtx = getUserContext();
        const movement = inferMovement(userCtx.speed);
        const currentInput = messageText;

        setMessages((prev) => [...prev, { role: 'user', content: currentInput }]);
        setInput('');
        setLoading(true);

        const requestContext = {
            userId: user?.id,
            authToken: token,
            mode: getAppMode(location),
            location: userLocation || location,
            distanceToMainSquare: userLocation?.distanceToMainSquare,
            weather,
            speed: userCtx.speed,
            movement,
            lastPage: userCtx.lastPage,
            timeOnPage: userCtx.timeOnPage,
            lastSearch: userCtx.lastSearch
        };

        try {
            const response = await fetch('/.netlify/functions/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: currentInput, conversationHistory: messages, context: requestContext }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [...prev, data]);

                await saveConversationToSupabase({ userId: user?.id, userMessage: currentInput, assistantMessage: data, context: requestContext });

                if (data.debug?.intent) {
                    const i = data.debug.intent;
                    if (['events', 'accommodation', 'general_info', 'planning'].includes(i)) {
                        import('../ai/BehaviorEngine').then(({ setTravelIntent }) => setTravelIntent(true));
                    }
                }

                if (data.action) handleNavigation(data.action);

                if (data.debug || data.action) {
                    setLastDecision({
                        intent: data.debug?.intent || 'unknown',
                        action: data.action,
                        score: data.debug?.score,
                        timestamp: new Date().toISOString(),
                        ...data.debug
                    });
                }
            } else {
                throw new Error('Backend failed');
            }
        } catch (error) {
            console.warn('AI Backend Error (switching to mock):', error);
            setTimeout(async () => {
                let mockResponse = MOCK_RESPONSES.default;
                const lowerInput = currentInput.toLowerCase();
                if (lowerInput.includes('program') || lowerInput.includes('esemény')) mockResponse = MOCK_RESPONSES.events;

                setMessages((prev) => [...prev, mockResponse]);
                await saveConversationToSupabase({ userId: user?.id, userMessage: currentInput, assistantMessage: mockResponse, context: requestContext });
                if (mockResponse.action) handleNavigation(mockResponse.action);
                setLoading(false);
            }, 1000);
            return;
        }
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // Apple Sheet animation — slides up from bottom, full height minus safe areas
    const sheetVariants = {
        hidden: {
            y: '100%',
            opacity: 0,
            borderRadius: '28px 28px 0 0',
        },
        visible: {
            y: 0,
            opacity: 1,
            borderRadius: '28px 28px 0 0',
            transition: {
                type: 'spring',
                stiffness: 380,
                damping: 40,
                mass: 0.8,
            }
        },
        exit: {
            y: '100%',
            opacity: 0,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 38,
                mass: 0.7,
            }
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const getActionIcon = (actionType) => {
        if (!actionType) return null;
        if (actionType.includes('event')) return '🎭';
        if (actionType.includes('parking')) return '🅿️';
        if (actionType.includes('attraction')) return '🏰';
        if (actionType.includes('hotel')) return '🛏️';
        if (actionType.includes('map')) return '🗺️';
        return '→';
    };

    return (
        <>
            {/* Suggestion Bubble */}
            <AnimatePresence>
                {suggestion && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={handleSuggestionClick}
                        className="fixed bottom-24 right-4 z-[9990] max-w-[260px] cursor-pointer"
                    >
                        <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/8 dark:border-white/10 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 shadow-lg">
                                <IoSparkles className="text-white text-sm" />
                            </div>
                            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100 leading-snug flex-1">
                                {suggestion.text}
                            </p>
                            <button
                                onClick={(e) => { e.stopPropagation(); dismissSuggestion(); }}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <IoClose size={12} />
                            </button>
                        </div>
                        {/* Tail */}
                        <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white/95 dark:bg-[#1c1c1e]/95 border-r border-b border-black/8 dark:border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-5 z-[9998] w-[52px] h-[52px] rounded-full bg-black dark:bg-white text-white dark:text-black shadow-2xl flex items-center justify-center"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
                whileTap={{ scale: 0.92 }}
                animate={suggestion && !isOpen ? {
                    scale: [1, 1.08, 1],
                    transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
                } : { scale: 1 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <IoChevronDown className="text-xl" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <IoSparkles className="text-lg" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[9995] bg-black/40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Apple Sheet Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col overflow-hidden"
                        style={{
                            height: 'calc(100dvh - 56px)', // reaches just below header
                            background: 'rgba(250, 250, 252, 0.92)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            boxShadow: '0 -1px 0 rgba(0,0,0,0.08), 0 -20px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        {/* Dark mode overlay */}
                        <div className="absolute inset-0 dark:bg-[#1c1c1e]/85 pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="relative z-10 flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-9 h-1 rounded-full bg-black/20 dark:bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                                    <IoSparkles className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Kőszeg AI</h2>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-black/6 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                            >
                                <IoClose size={16} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative z-10 h-px bg-black/6 dark:bg-white/8 mx-5 shrink-0" />

                        {/* Messages */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>

                            {/* Empty State */}
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="flex flex-col items-center justify-center h-full text-center pb-8"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                                        <IoSparkles className="text-2xl text-violet-500" />
                                    </div>
                                    <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-1">Sziasztok!</h3>
                                    <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed mb-6">
                                        Kőszeg városismerője vagyok. Miben segíthetek?
                                    </p>

                                    {/* Quick action chips */}
                                    <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                                        {QUICK_ACTIONS.map((action, i) => (
                                            <motion.button
                                                key={action.label}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + i * 0.06 }}
                                                onClick={() => { setInput(action.query); sendMessage(action.query); }}
                                                className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-white/8 rounded-2xl border border-black/6 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-white/12 transition-all text-left"
                                            >
                                                <span className="text-lg">{action.emoji}</span>
                                                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Messages */}
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-sm">
                                            <IoSparkles className="text-white text-[9px]" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-md shadow-sm'
                                            : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-md border border-black/5 dark:border-white/8 shadow-sm'
                                            }`}
                                    >
                                        {msg.content}
                                        {msg.action?.type && (
                                            <div className="mt-2 pt-2 border-t border-black/6 dark:border-white/10 flex items-center gap-1.5 text-[11px] opacity-60">
                                                <span>{getActionIcon(msg.action.type)}</span>
                                                <span>Megnyitás...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing */}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                                        <IoSparkles className="text-white text-[9px]" />
                                    </div>
                                    <div className="bg-white dark:bg-white/10 border border-black/5 dark:border-white/8 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex gap-1 items-center">
                                        {[0, 0.18, 0.36].map((delay, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.7, delay, ease: 'easeInOut' }}
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Action Status */}
                            <AnimatePresence>
                                {actionStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex justify-center"
                                    >
                                        <div className="flex items-center gap-2 px-4 py-2 bg-black/80 dark:bg-white/15 backdrop-blur-md rounded-full text-white text-[12px] font-medium shadow-lg">
                                            <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                            <span>Megnyitás...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div
                            className="relative z-10 px-4 py-3 shrink-0"
                            style={{
                                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                background: 'rgba(250,250,252,0.7)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <div className="dark:hidden absolute inset-0 bg-white/60 pointer-events-none" />
                            <div className="hidden dark:block absolute inset-0 bg-[#1c1c1e]/60 pointer-events-none" />
                            <div className="relative flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Kérdezz valamit..."
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/8 rounded-2xl text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-black/5 dark:border-white/8 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50"
                                    style={{ fontSize: '16px' }} // prevents iOS zoom
                                />
                                <motion.button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    whileTap={{ scale: 0.88 }}
                                    className="w-10 h-10 rounded-full bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-white/10 flex items-center justify-center shadow-sm transition-colors shrink-0"
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
