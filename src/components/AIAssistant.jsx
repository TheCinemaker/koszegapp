import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles, IoClose, IoSend, IoNavigate, IoRestaurant, IoCalendar, IoCar } from 'react-icons/io5';
import { AIOrchestratorContext } from '../contexts/AIOrchestratorContext';
import { LocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAppMode } from '../core/ContextEngine';
import { getUserContext, updateAppMode } from '../core/UserContextEngine';
import { inferMovement } from '../core/MovementEngine';

// Mock response for local development when backend is unreachable
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
    },
    food: {
        role: 'assistant',
        content: 'Éhes vagy? Megnyitom a KoszegEats-t.',
        action: { type: 'navigate_to_food', params: {} }
    }
};

export default function AIAssistant() {
    const { user, token } = useAuth();
    const { suggestion, acceptSuggestion, dismiss: dismissSuggestion, setLastDecision, userLocation } = useContext(AIOrchestratorContext);
    const { location } = useContext(LocationContext);

    // Sync Location & Mode to Global Context
    useEffect(() => {
        if (!location) return;
        const mode = getAppMode(location);
        updateAppMode(mode);
    }, [location]);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionStatus, setActionStatus] = useState(null); // 'pending', 'executed'
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Handle suggestion click (proactive message injection)
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleNavigation = (action) => {
        if (!action) return;

        console.log("Executing action:", action);
        setActionStatus({ type: action.type, status: 'executing' });

        setTimeout(() => {
            switch (action.type) {
                case 'navigate_to_home':
                    navigate('/');
                    break;
                case 'navigate_to_events':
                    navigate('/events');
                    break;
                case 'navigate_to_event_detail':
                    navigate(`/events/${action.params?.id}`);
                    break;
                case 'navigate_to_food':
                    console.log("Blocked food navigation"); // Safe fallback
                    break;
                case 'navigate_to_parking':
                    navigate('/parking');
                    break;
                case 'navigate_to_parking_detail':
                    navigate(`/parking/${action.params?.id}`);
                    break;
                case 'navigate_to_attractions':
                    navigate('/attractions');
                    break;
                case 'navigate_to_attraction_detail':
                    navigate(`/attractions/${action.params?.id}`);
                    break;
                case 'navigate_to_hotels':
                    navigate('/hotels');
                    break;
                case 'navigate_to_hotel_detail':
                    navigate(`/hotels/${action.params?.id}`);
                    break;
                case 'navigate_to_leisure':
                    navigate('/leisure');
                    break;
                case 'navigate_to_leisure_detail':
                    navigate(`/leisure/${action.params?.id}`);
                    break;
                case 'navigate_to_pass':
                    navigate('/pass');
                    break;
                case 'navigate_to_info':
                    navigate('/info');
                    break;
                case 'buy_parking_ticket':
                    navigate('/parking', { state: { licensePlate: action.params?.licensePlate || '', zone: action.params?.zone || '' } });
                    break;
                case 'call_emergency':
                    window.location.href = 'tel:112';
                    break;
                case 'call_phone':
                    if (action.params?.number) {
                        window.location.href = `tel:${action.params.number}`;
                    }
                    break;
                case 'add_to_wallet':
                    // Proactive Walltet Integration Demo
                    alert(`🎟️ Esemény jegy hozzáadva az Apple Wallet-hez! (Event ID: ${action.params?.eventId})`);
                    break;
                default:
                    console.warn('Unknown action:', action.type);
                    break;
            }
            setActionStatus(null);
        }, 1500); // Visual delay to show the "acting" state
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userCtx = getUserContext();
        const movement = inferMovement(userCtx.speed);

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Try to fetch from backend
            const response = await fetch('/.netlify/functions/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
                    conversationHistory: messages,
                    context: {
                        userId: user?.id,
                        authToken: token, // 🔐 Pass JWT for RLS
                        mode: getAppMode(location),
                        location: userLocation || location,
                        distanceToMainSquare: userLocation?.distanceToMainSquare,
                        // ...
                        speed: userCtx.speed,
                        movement: movement,
                        lastPage: userCtx.lastPage,
                        timeOnPage: userCtx.timeOnPage,
                        lastSearch: userCtx.lastSearch
                    }
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [...prev, data]);

                // 🧠 Learn from Intent
                if (data.debug?.intent) {
                    const i = data.debug.intent;
                    if (['events', 'accommodation', 'general_info', 'planning'].includes(i)) {
                        import('../ai/BehaviorEngine').then(({ setTravelIntent }) => {
                            setTravelIntent(true);
                        });
                    }
                }

                if (data.action) {
                    handleNavigation(data.action);
                }

                // 🐛 Debug Logging
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

            // Local Mock Fallback for Development
            setTimeout(() => {
                let mockResponse = MOCK_RESPONSES.default;
                const lowerInput = input.toLowerCase();

                if (lowerInput.includes('program') || lowerInput.includes('esemény')) {
                    mockResponse = MOCK_RESPONSES.events;
                } else if (lowerInput.includes('étel') || lowerInput.includes('kaja')) {
                    mockResponse = MOCK_RESPONSES.food;
                }

                setMessages((prev) => [...prev, mockResponse]);
                if (mockResponse.action) {
                    handleNavigation(mockResponse.action);
                }
                setLoading(false);
            }, 1000);
            return;
        }

        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Animation Variants
    const windowVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' },
        visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }
    };

    return (
        <>
            {/* Smart Suggestion Bubble (Layer 2) */}
            <AnimatePresence>
                {suggestion && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, y: 10, x: 20 }}
                        onClick={handleSuggestionClick}
                        className="fixed bottom-24 right-6 z-[9990] max-w-[280px] bg-white dark:bg-[#1a1d2d] border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer hover:shadow-2xl transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                            {suggestion.type === 'food' ? <IoRestaurant className="text-blue-600 dark:text-blue-400" /> :
                                suggestion.type === 'event' ? <IoCalendar className="text-purple-600 dark:text-purple-400" /> :
                                    <IoSparkles className="text-amber-500" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                                {suggestion.text}
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); dismissSuggestion(); }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"
                        >
                            <IoClose size={16} />
                        </button>

                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-[#1a1d2d] border-r border-b border-gray-200 dark:border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Bubble Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full ${suggestion ? 'bg-indigo-600' : 'bg-black/80'} backdrop-blur-md text-white shadow-2xl flex items-center justify-center border border-white/10`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={suggestion ? {
                    scale: [1, 1.1, 1],
                    boxShadow: ["0px 0px 0px rgba(79, 70, 229, 0)", "0px 0px 20px rgba(79, 70, 229, 0.6)", "0px 0px 0px rgba(79, 70, 229, 0)"]
                } : { opacity: 1, scale: 1 }}
                transition={suggestion ? { repeat: Infinity, duration: 2 } : {}}
            >
                {isOpen ? <IoClose className="text-2xl" /> : <IoSparkles className="text-xl" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={windowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 right-6 z-[9999] w-[350px] md:w-[400px] h-[600px] bg-white/80 dark:bg-black/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                    <IoSparkles className="text-sm" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Kőszeg AI</h3>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Assistant</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">

                            {/* Empty State */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                                    <IoSparkles className="text-3xl text-purple-500/50" />
                                    <p className="text-sm text-gray-500 max-w-[200px]">
                                        Szia! Én vagyok a városi AI asszisztensed. Miben segíthetek?
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button onClick={() => setInput("Hol egyek?")} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 transition-colors">🍕 Hol egyek?</button>
                                        <button onClick={() => setInput("Milyen programok vannak?")} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 transition-colors">📅 Programok</button>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-black/5 dark:border-white/5'
                                            }`}
                                    >
                                        {msg.content}

                                        {/* Action Indicator in Chat */}
                                        {msg.action && (
                                            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center gap-2 text-xs opacity-80">
                                                {msg.action.type.includes('event') && <IoCalendar />}
                                                {msg.action.type.includes('food') && <IoRestaurant />}
                                                {(msg.action.type.includes('parking') || msg.action.type.includes('navigate')) && <IoNavigate />}
                                                <span>Művelet indítása...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-white dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Action Status Overlay */}
                        <AnimatePresence>
                            {actionStatus && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    className="absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl flex items-center gap-3 shadow-lg z-10"
                                >
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Navigálás...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="p-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border-t border-black/5 dark:border-white/5">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Kérdezz valamit..."
                                    disabled={loading}
                                    className="w-full pl-4 pr-12 py-3 bg-white/80 dark:bg-white/5 rounded-2xl text-sm border-none shadow-sm focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <IoSend className="text-sm" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
