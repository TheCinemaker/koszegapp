import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoCard, IoCheckmarkCircle, IoBusiness, IoPerson } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PassPurchase() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Retrieve registration data from location state
    const regData = location.state?.registrationData;

    // Billing state
    const [billing, setBilling] = useState({
        zip: '',
        city: '',
        address: ''
    });

    const [passType, setPassType] = useState('individual'); // 'individual' | 'family'
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (!regData) {
            // Redirect back to registration if page loaded directly without data
            toast.error('Kérjük, először töltsd ki a regisztrációs adatokat!');
            navigate('/pass/register');
        } else {
            // Pre-fill billing zip with origin zip as a helpful default
            if (regData.originZip) {
                setBilling(b => ({ ...b, zip: regData.originZip }));
            }
        }
    }, [regData, navigate]);

    if (!regData) return null;

    const handleCheckout = async (e) => {
        e.preventDefault();

        if (!billing.zip.trim() || !billing.city.trim() || !billing.address.trim()) {
            toast.error('Kérjük, add meg a teljes számlázási címet a számla kiállításához!');
            return;
        }

        setPurchasing(true);
        const loadToast = toast.loading('Fizetési felület betöltése...');

        try {
            const response = await fetch('/.netlify/functions/koszeg-pass-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passType,
                    holderName: regData.holderName,
                    holderEmail: regData.holderEmail,
                    zip: billing.zip,
                    city: billing.city,
                    address: billing.address,
                    hotelSource: regData.hotelSource || '',
                    originZip: regData.originZip || '',
                    phone: regData.phone || '',
                    extraInfo: regData.extraInfo || ''
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Hiba történt a fizetés kezdeményezésekor');
            }

            // Redirect to Stripe Checkout
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Nincs checkout URL a válaszban');
            }

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Sikertelen kapcsolódás a fizetési szolgáltatóhoz');
        } finally {
            toast.dismiss(loadToast);
            setPurchasing(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-lg z-10 my-8"
            >
                {/* Back button */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-full transition-colors mb-6 flex items-center justify-center w-10 h-10 shadow-sm"
                >
                    <IoArrowBack size={20} className="text-gray-600 dark:text-gray-300" />
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-brand dark:text-white">
                        KőszegPass Megrendelés
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                        Válaszd ki a kártya típusát és add meg a számlázási adataidat.
                    </p>
                </div>

                {/* Summary Box */}
                <div className="bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm rounded-2xl p-4 mb-6 text-xs space-y-2">
                    <h3 className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                        <IoPerson size={12} className="text-brand dark:text-brand-light" />
                        Regisztrált Adataid
                    </h3>
                    <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Név:</span> {regData.holderName}</p>
                    <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Email:</span> {regData.holderEmail}</p>
                    {regData.phone && <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Telefon:</span> {regData.phone}</p>}
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                    {/* Pass Type Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Kártya Típusa</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Individual Pass */}
                            <div
                                onClick={() => setPassType('individual')}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                                    passType === 'individual' 
                                        ? 'bg-brand/5 border-brand dark:bg-indigo-500/10 dark:border-indigo-500 shadow-md shadow-brand/10' 
                                        : 'bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/30'
                                }`}
                            >
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between">
                                        <span>Egyéni Pass</span>
                                        {passType === 'individual' && <IoCheckmarkCircle className="text-brand dark:text-indigo-400 text-lg" />}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">1 személy részére</p>
                                </div>
                                <p className="text-xl font-black text-brand dark:text-brand-light">4 000 Ft</p>
                            </div>

                            {/* Family Pass */}
                            <div
                                onClick={() => setPassType('family')}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                                    passType === 'family' 
                                        ? 'bg-brand/5 border-brand dark:bg-indigo-500/10 dark:border-indigo-500 shadow-md shadow-brand/10' 
                                        : 'bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/30'
                                }`}
                            >
                                <div className="absolute top-0 right-0 bg-brand dark:bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-tr-xl rounded-bl-xl uppercase tracking-wider">
                                    Családi
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between pr-8">
                                        <span>Családi Pass</span>
                                        {passType === 'family' && <IoCheckmarkCircle className="text-brand dark:text-indigo-400 text-lg" />}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">2 felnőtt + gyerekek</p>
                                </div>
                                <p className="text-xl font-black text-brand dark:text-brand-light">10 000 Ft</p>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details (Mandatory for Invoicing) */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1 flex items-center gap-1.5">
                            <IoBusiness size={12} className="text-brand dark:text-brand-light" />
                            Számlázási Cím
                        </h3>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Zip */}
                            <div className="col-span-1 space-y-1">
                                <label className="text-[8px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Irányítószám</label>
                                <input
                                    type="text"
                                    required
                                    value={billing.zip}
                                    onChange={e => setBilling({ ...billing, zip: e.target.value })}
                                    className="w-full h-11 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl px-3 outline-none text-xs text-gray-900 dark:text-white focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500"
                                    placeholder="9700"
                                />
                            </div>

                            {/* City */}
                            <div className="col-span-2 space-y-1">
                                <label className="text-[8px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Város</label>
                                <input
                                    type="text"
                                    required
                                    value={billing.city}
                                    onChange={e => setBilling({ ...billing, city: e.target.value })}
                                    className="w-full h-11 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl px-3 outline-none text-xs text-gray-900 dark:text-white focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500"
                                    placeholder="Kőszeg"
                                />
                            </div>

                            {/* Address */}
                            <div className="col-span-3 space-y-1">
                                <label className="text-[8px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Utca, házszám</label>
                                <input
                                    type="text"
                                    required
                                    value={billing.address}
                                    onChange={e => setBilling({ ...billing, address: e.target.value })}
                                    className="w-full h-11 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl px-3 outline-none text-xs text-gray-900 dark:text-white focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500"
                                    placeholder="Fő tér 1."
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={purchasing}
                        className="w-full h-14 bg-brand dark:bg-indigo-500 hover:opacity-90 active:scale-95 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 pt-1 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {purchasing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Feldolgozás...</span>
                            </>
                        ) : (
                            <>
                                <IoCard size={20} />
                                <span>Biztonságos Fizetés</span>
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        A fizetést a Stripe biztonságos felülete kezeli. A tranzakció sikere után a számlát a Billingo rendszere automatikusan megküldi a megadott email címre.
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
