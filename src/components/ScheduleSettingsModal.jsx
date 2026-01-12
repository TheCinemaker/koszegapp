import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoClose, IoSave, IoTime } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const DAYS_HU = [
    { id: '1', name: 'Hétfő' },
    { id: '2', name: 'Kedd' },
    { id: '3', name: 'Szerda' },
    { id: '4', name: 'Csütörtök' },
    { id: '5', name: 'Péntek' },
    { id: '6', name: 'Szombat' },
    { id: '0', name: 'Vasárnap' }
];

const DEFAULT_SCHEDULE = {
    "1": { "start": "09:00", "end": "17:00", "active": true },
    "2": { "start": "09:00", "end": "17:00", "active": true },
    "3": { "start": "09:00", "end": "17:00", "active": true },
    "4": { "start": "09:00", "end": "17:00", "active": true },
    "5": { "start": "09:00", "end": "17:00", "active": true },
    "6": { "start": "09:00", "end": "13:00", "active": false },
    "0": { "start": "09:00", "end": "13:00", "active": false }
};

export default function ScheduleSettingsModal({ isOpen, onClose, providerId, currentSettings, onUpdate }) {
    const [schedule, setSchedule] = useState(currentSettings || DEFAULT_SCHEDULE);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (dayId, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('providers')
                .update({ schedule_settings: schedule })
                .eq('id', providerId);

            if (error) throw error;

            toast.success('Munkarend mentve! ✅');
            onUpdate(schedule); // Update parent state without refetch
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba a mentéskor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="
                    relative w-full max-w-lg 
                    bg-white dark:bg-zinc-900 
                    rounded-[2rem] shadow-2xl 
                    overflow-hidden border border-zinc-100 dark:border-white/10
                    flex flex-col max-h-[90vh]
                "
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <IoTime className="text-blue-500" />
                            Munkarend Beállítása
                        </h3>
                        <p className="text-xs text-zinc-500">Állítsd be, mely napokon vagy nyitva.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors">
                        <IoClose className="text-zinc-500" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        {DAYS_HU.map((day) => {
                            const settings = schedule[day.id] || DEFAULT_SCHEDULE[day.id];
                            return (
                                <div
                                    key={day.id}
                                    className={`
                                        p-4 rounded-xl border transition-all duration-200
                                        ${settings.active
                                            ? 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                                            : 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent opacity-60'}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={settings.active}
                                                onChange={(e) => handleChange(day.id, 'active', e.target.checked)}
                                                className="w-5 h-5 rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`font-bold ${settings.active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                                                {day.name}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold uppercase text-zinc-400">
                                            {settings.active ? 'Nyitva' : 'Zárva'}
                                        </div>
                                    </div>

                                    {settings.active && (
                                        <>
                                            <div className="flex items-center gap-4 pl-8">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Nyitás</label>
                                                    <input
                                                        type="time"
                                                        value={settings.start}
                                                        onChange={(e) => handleChange(day.id, 'start', e.target.value)}
                                                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold"
                                                    />
                                                </div>
                                                <span className="text-zinc-300 mt-4">—</span>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Zárás</label>
                                                    <input
                                                        type="time"
                                                        value={settings.end}
                                                        onChange={(e) => handleChange(day.id, 'end', e.target.value)}
                                                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>

                                            {/* Lunch Break Section */}
                                            <div className="mt-4 pl-8 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700/50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.hasLunch || false}
                                                        onChange={(e) => handleChange(day.id, 'hasLunch', e.target.checked)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                                                    />
                                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Ebédszünet</span>
                                                </div>

                                                {settings.hasLunch && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Kezdete</label>
                                                            <input
                                                                type="time"
                                                                value={settings.lunchStart || "12:00"}
                                                                onChange={(e) => handleChange(day.id, 'lunchStart', e.target.value)}
                                                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300"
                                                            />
                                                        </div>
                                                        <span className="text-zinc-200 mt-4">—</span>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Vége</label>
                                                            <input
                                                                type="time"
                                                                value={settings.lunchEnd || "12:30"}
                                                                onChange={(e) => handleChange(day.id, 'lunchEnd', e.target.value)}
                                                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="
                            w-full py-4 rounded-xl 
                            bg-blue-600 text-white font-bold text-lg 
                            shadow-lg shadow-blue-500/30 
                            flex items-center justify-center gap-2
                            hover:scale-[1.02] active:scale-95 transition-all
                            disabled:opacity-50
                        "
                    >
                        {loading ? 'Mentés...' : (
                            <>
                                Mentés <IoSave />
                            </>
                        )}
                    </button>
                </div>
            </motion.div >
        </div >
    );
}
