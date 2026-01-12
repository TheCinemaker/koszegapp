import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { IoClose, IoSend } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function MessageModal({ isOpen, onClose, recipientId, recipientName, senderId, bookingId }) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: senderId,
                    recipient_id: recipientId,
                    content: message.trim(),
                    is_read: false,
                    booking_id: bookingId
                });

            if (error) throw error;

            toast.success('Üzenet elküldve! 📨');
            setMessage('');
            onClose();
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Hiba az üzenet küldésekor.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="
                    relative w-full max-w-sm 
                    bg-white dark:bg-zinc-900 
                    rounded-[2rem] shadow-2xl 
                    overflow-hidden border border-zinc-100 dark:border-white/10
                    p-6
                "
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Üzenet küldése</h3>
                    <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors">
                        <IoClose className="text-zinc-500" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Címzett:</p>
                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{recipientName}</p>
                </div>

                <div className="mb-6">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Írd ide az üzenetet..."
                        className="
                            w-full h-32 p-4 rounded-xl 
                            bg-zinc-50 dark:bg-black/20 
                            border border-zinc-200 dark:border-zinc-700 
                            text-zinc-900 dark:text-white 
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                            resize-none
                        "
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={loading || !message.trim()}
                    className="
                        w-full py-4 rounded-xl 
                        bg-blue-600 text-white font-bold text-lg 
                        shadow-lg shadow-blue-500/30 
                        flex items-center justify-center gap-2
                        hover:scale-[1.02] active:scale-95 transition-all
                        disabled:opacity-50 disabled:grayscale
                    "
                >
                    {loading ? 'Küldés...' : (
                        <>
                            Küldés <IoSend />
                        </>
                    )}
                </button>
            </motion.div>
        </div>,
        document.body
    );
}
