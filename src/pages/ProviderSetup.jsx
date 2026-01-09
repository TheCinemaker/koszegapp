import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    IoStorefront,
    IoLocation,
    IoText,
    IoAdd,
    IoCheckmark,
    IoArrowForward,
    IoArrowBack,
    IoTime,
    IoCash,
    IoClose
} from 'react-icons/io5';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇', color: 'from-pink-500 to-rose-600' },
    { id: 'kormos', label: 'Körmös', icon: '💅', color: 'from-purple-500 to-indigo-600' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨', color: 'from-blue-500 to-cyan-600' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆', color: 'from-green-500 to-emerald-600' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨', color: 'from-orange-500 to-amber-600' },
];

export default function ProviderSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Business Details
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');

    // Step 2: Location & Description
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');

    // Step 3: Initial Services
    const [services, setServices] = useState([]);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 });

    const addService = () => {
        if (!newService.name || newService.price <= 0) {
            toast.error('Adj meg nevet és árat!');
            return;
        }
        setServices([...services, { ...newService, id: Date.now() }]);
        setNewService({ name: '', duration: 30, price: 0 });
        setShowServiceForm(false);
        toast.success('Szolgáltatás hozzáadva!');
    };

    const removeService = (id) => {
        setServices(services.filter(s => s.id !== id));
    };

    const handleSubmit = async () => {
        if (!businessName || !category) {
            toast.error('Töltsd ki a kötelező mezőket!');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Provider
            const { data: provider, error: providerError } = await supabase
                .from('providers')
                .insert({
                    user_id: user.id,
                    business_name: businessName,
                    category,
                    location_address: address,
                    description
                })
                .select()
                .single();

            if (providerError) throw providerError;

            // 2. Create Services (if any)
            if (services.length > 0) {
                const servicesData = services.map(s => ({
                    provider_id: provider.id,
                    name: s.name,
                    duration_min: s.duration,
                    price: s.price
                }));

                const { error: servicesError } = await supabase
                    .from('services')
                    .insert(servicesData);

                if (servicesError) throw servicesError;
            }

            toast.success('Üzlet sikeresen létrehozva! 🎉');
            navigate('/business-dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Hiba történt: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!businessName || !category)) {
            toast.error('Töltsd ki a kötelező mezőket!');
            return;
        }
        setStep(step + 1);
    };

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
                        {step === 1 && 'Alapadatok'}
                        {step === 2 && 'Helyszín és leírás'}
                        {step === 3 && 'Szolgáltatások (opcionális)'}
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
                                <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Üzlet neve *"
                                    required
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategória *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            className={`p-4 rounded-xl border-2 transition-all ${category === cat.id
                                                    ? `border-purple-500 bg-gradient-to-br ${cat.color} text-white`
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-purple-300'
                                                }`}
                                        >
                                            <div className="text-3xl mb-1">{cat.icon}</div>
                                            <div className="font-bold text-sm">{cat.label}</div>
                                        </button>
                                    ))}
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
                            className="space-y-4"
                        >
                            <div className="relative">
                                <IoLocation className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Cím (pl. Kőszeg, Fő tér 1.)"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div className="relative">
                                <IoText className="absolute left-4 top-4 text-zinc-400" />
                                <textarea
                                    placeholder="Rövid leírás az üzletről..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full pl-12 pr-4 pt-3 pb-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all dark:text-white resize-none"
                                />
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-zinc-900 dark:text-white">Szolgáltatások</h3>
                                <button
                                    onClick={() => setShowServiceForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                                >
                                    <IoAdd /> Hozzáad
                                </button>
                            </div>

                            {services.length === 0 && !showServiceForm && (
                                <p className="text-center text-zinc-400 py-8">Még nincs szolgáltatás hozzáadva</p>
                            )}

                            {services.map(service => (
                                <div key={service.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <div>
                                        <div className="font-bold text-zinc-900 dark:text-white">{service.name}</div>
                                        <div className="text-sm text-zinc-500">{service.duration} perc • {service.price} Ft</div>
                                    </div>
                                    <button onClick={() => removeService(service.id)} className="text-red-500 hover:text-red-700">
                                        <IoClose size={24} />
                                    </button>
                                </div>
                            ))}

                            {showServiceForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3"
                                >
                                    <input
                                        type="text"
                                        placeholder="Szolgáltatás neve"
                                        value={newService.name}
                                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                                        className="w-full h-10 px-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <IoTime className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="number"
                                                placeholder="Időtartam"
                                                value={newService.duration}
                                                onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                                                className="w-full h-10 pl-10 pr-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            />
                                        </div>
                                        <div className="relative">
                                            <IoCash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="number"
                                                placeholder="Ár (Ft)"
                                                value={newService.price}
                                                onChange={e => setNewService({ ...newService, price: parseInt(e.target.value) })}
                                                className="w-full h-10 pl-10 pr-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={addService} className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                            Hozzáad
                                        </button>
                                        <button onClick={() => setShowServiceForm(false)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600">
                                            Mégse
                                        </button>
                                    </div>
                                </motion.div>
                            )}
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
