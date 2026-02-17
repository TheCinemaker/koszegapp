import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles, IoClose, IoSend } from 'react-icons/io5';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNavigation = (action) => {
        if (!action) return;

        switch (action.type) {
            case 'navigate_to_events':
                navigate('/events');
                break;
            case 'navigate_to_food':
                navigate('/food', { state: { searchQuery: action.params?.search || '' } });
                break;
            case 'navigate_to_parking':
                navigate('/parking');
                break;
            case 'navigate_to_attractions':
                navigate('/attractions');
                break;
            case 'navigate_to_hotels':
                navigate('/hotels');
                break;
            case 'navigate_to_leisure':
                navigate('/leisure');
                break;
            default:
                break;
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/.netlify/functions/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
                    conversationHistory: messages,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [...prev, data]);

                // Handle navigation action
                if (data.action) {
                    setTimeout(() => handleNavigation(data.action), 1000);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: 'Sajnálom, hiba történt. Próbáld újra!' },
                ]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Nem sikerült kapcsolódni. Ellenőrizd az internetkapcsolatot!' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Bubble */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9998] w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <IoSparkles className="text-2xl" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-[9999] w-96 h-[600px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IoSparkles className="text-2xl" />
                                <div>
                                    <h3 className="font-bold">Kőszeg AI</h3>
                                    <p className="text-xs opacity-80">Segíthetek?</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                                <IoClose className="text-xl" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                    <IoSparkles className="text-4xl mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Kérdezz bármit Kőszegről!</p>
                                    <div className="mt-4 space-y-2">
                                        <button
                                            onClick={() => setInput('Milyen programok vannak ma?')}
                                            className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Milyen programok vannak ma?
                                        </button>
                                        <button
                                            onClick={() => setInput('Hol tudok ételt rendelni?')}
                                            className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors block mx-auto"
                                        >
                                            Hol tudok ételt rendelni?
                                        </button>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Írj egy üzenetet..."
                                    className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    disabled={loading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoSend />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
