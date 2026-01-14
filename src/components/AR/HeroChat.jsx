import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Volume2, User, Sparkles } from 'lucide-react';

const HeroChat = ({ heroName, onSendMessage, isListening, messages }) => {
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);

    // Quick Replies
    const suggestions = ["Mi a helyzet?", "Mesélj az ostromról!", "Hogy győztetek?", "Szereted a bort?"];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    // Web Speech API
    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("A böngésződ nem támogatja a hangfelismerést.");
            return;
        }

        if (isRecording) {
            setIsRecording(false);
            // Recognition stops automatically or manually
        } else {
            const recognition = new window.webkitSpeechRecognition();
            recognition.lang = 'hu-HU';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsRecording(true);
            recognition.onend = () => setIsRecording(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setTimeout(() => {
                    onSendMessage(transcript);
                    setInput('');
                }, 500);
            };
            recognition.start();
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-50 flex flex-col justify-end h-[50vh] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-2 px-2 pointer-events-auto space-y-4 no-scrollbar">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl backdrop-blur-md shadow-lg border ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none border-indigo-500/50'
                                        : 'bg-white/90 text-gray-900 rounded-bl-none border-white/50'
                                    }`}
                            >
                                {msg.role === 'hero' && (
                                    <div className="flex items-center gap-2 mb-1 opacity-70 border-b border-black/10 pb-1">
                                        <Sparkles className="w-3 h-3 text-yellow-600" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{heroName}</span>
                                    </div>
                                )}
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="flex gap-2 overflow-x-auto pb-3 px-1 pointer-events-auto no-scrollbar mask-gradient">
                {suggestions.map((text) => (
                    <button
                        key={text}
                        onClick={() => onSendMessage(text)}
                        className="whitespace-nowrap bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition-colors"
                    >
                        {text}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-white/20 shadow-2xl">
                <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white ring-4 ring-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Mic className="w-5 h-5" />
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Írj vagy beszélj..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-base px-2 h-full"
                />

                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-indigo-600 rounded-full text-white disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default HeroChat;
