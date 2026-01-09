import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    IoCheckmark,
    IoArrowForward,
    IoArrowBack,
    IoText,
    IoCalendar,
    IoTime,
    IoCall,
    IoLocation
} from 'react-icons/io5';

const DAYS = [
    { id: 'monday', label: 'Hétfő' },
    { id: 'tuesday', label: 'Kedd' },
    { id: 'wednesday', label: 'Szerda' },
    { id: 'thursday', label: 'Csütörtök' },
    { id: 'friday', label: 'Péntek' },
    { id: 'saturday', label: 'Szombat' },
    { id: 'sunday', label: 'Vasárnap' },
];

const SLOT_DURATIONS = [15, 30, 45, 60];

export default function ProviderSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Welcome Message
    const [welcomeMessage, setWelcomeMessage] = useState('');

    // Step 2: Availability
    const [workingDays, setWorkingDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [slotDuration, setSlotDuration] = useState(30);

    // Step 3: Optional Details
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const toggleDay = (dayId) => {
        if (workingDays.includes(dayId)) {
            setWorkingDays(workingDays.filter(d => d !== dayId));
        } else {
            setWorkingDays([...workingDays, dayId]);
        }
    };

    const handleSubmit = async () => {
        if (!welcomeMessage) {
            toast.error('Írj egy üdvözlő üzenetet!');
            return;
        }

        if (workingDays.length === 0) {
            toast.error('Válassz legalább egy munkanapot!');
            return;
        }

        setLoading(true);
        try {
            // Get business details from user metadata
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const businessName = authUser?.user_metadata?.business_name;
            const category = authUser?.user_metadata?.category;

            // Create provider entry
            const { error } = await supabase
                .from('providers')
                .insert({
                    user_id: user.id,
                    business_name: businessName,
                    category,
                    welcome_message: welcomeMessage,
                    working_days: workingDays,
                    working_hours: { start: startTime, end: endTime },
                    slot_duration: slotDuration,
                    phone,
                    location_address: address
                });

            if (error) throw error;

            toast.success('Üzlet sikeresen beállítva! 🎉');
            navigate('/business-dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Hiba történt: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 p-6 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-white/10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                        Üzlet Beállítása
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        {step === 1 && 'Üdvözlő üzenet'}
                        {step === 2 && 'Nyitvatartás és időbeosztás'}
                        {step === 3 && 'Opcionális adatok'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s <= step
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                                }`}>
                                {s < step ? <IoCheckmark /> : s}
                            </div>
                            {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-purple-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <IoText className="absolute left-4 top-4 text-zinc-400" />
                                <textarea
                                    placeholder="Pl: Szia! Üdv a Juli Szalonban! 💇 Várlak szeretettel!"
                                    value={welcomeMessage}
                                    onChange={e => setWelcomeMessage(e.target.value)}
                                    rows={5}
                                    maxLength={500}
                                    className="w-full pl-12 pr-4 pt-3 pb-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all dark:text-white resize-none"
                                />
                                <div className="text-right text-xs text-zinc-400 mt-1">
                                    {welcomeMessage.length}/500
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Working Days */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                    <IoCalendar /> Munkanapok
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DAYS.map(day => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(day.id)}
                                            className={`p-3 rounded-xl border-2 transition-all font-medium ${workingDays.includes(day.id)
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-purple-300'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Working Hours */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                    <IoTime /> Nyitvatartás
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Nyitás</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Zárás</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Slot Duration */}
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                                    Időintervallum (perc)
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SLOT_DURATIONS.map(duration => (
                                        <button
                                            key={duration}
                                            type="button"
                                            onClick={() => setSlotDuration(duration)}
                                            className={`p-3 rounded-xl border-2 transition-all font-bold ${slotDuration === duration
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-purple-300'
                                                }`}
                                        >
                                            {duration}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <IoCall className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="tel"
                                    placeholder="Telefonszám (opcionális)"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                />
                            </div>

                            <div className="relative">
                                <IoLocation className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Cím (opcionális)"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8">
                    {step > 1 && (
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                        >
                            <IoArrowBack /> Vissza
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold"
                        >
                            Tovább <IoArrowForward />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold disabled:opacity-50"
                        >
                            {loading ? 'Folyamatban...' : 'Befejezés'} <IoCheckmark />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
