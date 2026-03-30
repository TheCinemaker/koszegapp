import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMail, IoClose, IoCheckmarkDone } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';

export default function UserMessageRibbon() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Fetch unread messages
    const fetchMessages = async () => {
        if (!user) return;
        try {
            // Egyszerűsített lekérdezés, hogy elkerüljük az FK (foreign key) hiánya miatti HTTP 400-as hibákat (PGRST200)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('recipient_id', user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        fetchMessages();

        if (!user) return;

        // Realtime subscription
        const subscription = supabase
            .channel('my-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`
                },
                (payload) => {
                    console.log("New message:", payload);
                    // Provide visual feedback
                    toast("Új üzeneted érkezett!", { icon: '📩' });
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const handleRead = async (msg) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', msg.id);

            if (error) throw error;

            setMessages(prev => prev.filter(m => m.id !== msg.id));
            setSelectedMessage(null);
            toast.success("Üzenet olvasva");
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const formatBookingTime = (booking) => {
        if (!booking || !booking.start_time) return null;
        try {
            return format(parseISO(booking.start_time), "MMM d., HH:mm", { locale: hu });
        } catch (e) { return null; }
    };

    const parseMessage = (rawContent) => {
        let name = 'Ismeretlen feladó (Szolgáltató)';
        let text = rawContent || '';
        const match = text.match(/^\[#SZOLG:(.*?)\]\s*(.*)/s);
        if (match) {
            name = match[1] === 'undefined' ? name : match[1];
            text = match[2];
        }
        return { name, text };
    };

    if (messages.length === 0) return null;

    return (
        <>
            {/* Ribbon */}
            <div className="fixed bottom-40 left-0 right-0 z-[45] pointer-events-none flex justify-center px-4">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="pointer-events-auto max-w-sm w-full"
                >
                    <button
                        onClick={() => setSelectedMessage(messages[0])}
                        className="
                            w-full bg-blue-600/90 backdrop-blur-md 
                            text-white p-3 rounded-2xl shadow-xl shadow-blue-900/20
                            flex items-center gap-3 border border-white/10
                            hover:scale-[1.02] active:scale-95 transition-all
                        "
                    >
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
                            <IoMail />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <h4 className="font-bold text-sm truncate">
                                {parseMessage(messages[0].content).name}
                            </h4>
                            <p className="text-xs text-blue-100 truncate">
                                {parseMessage(messages[0].content).text}
                            </p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {messages.length}
                        </div>
                    </button>
                </motion.div>
            </div>

            {/* Message Detail Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4 pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedMessage(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="
                                relative w-full max-w-sm 
                                bg-white dark:bg-zinc-900 
                                rounded-[2rem] shadow-2xl overflow-hidden
                                border border-zinc-100 dark:border-white/10
                                flex flex-col
                            "
                        >
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                                            {parseMessage(selectedMessage.content).name}
                                        </h3>
                                        <p className="text-sm text-zinc-500 font-medium">Új üzenet</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"
                                    >
                                        <IoClose />
                                    </button>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed font-medium">
                                    "{parseMessage(selectedMessage.content).text}"
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-white/5">
                                <button
                                    onClick={() => handleRead(selectedMessage)}
                                    className="
                                        w-full py-3 rounded-xl 
                                        bg-blue-600 text-white font-bold text-lg 
                                        shadow-lg shadow-blue-500/30 
                                        flex items-center justify-center gap-2
                                        active:scale-95 transition-transform
                                    "
                                >
                                    Elolvastam <IoCheckmarkDone />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
