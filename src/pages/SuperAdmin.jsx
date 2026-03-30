import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { IoLockClosed, IoTrendingUp, IoRestaurant, IoWallet, IoLogOut, IoCalendar, IoCheckmarkCircle, IoWarning, IoTime } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function SuperAdmin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Hónapválasztó logika
    const currentDate = new Date();
    const currentMonthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthString);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'TheCinemaker' && password === 'Nyanyuska_0169') {
            setIsAuthenticated(true);
        } else {
            toast.error('Hibás hitelesítő adatok!');
        }
    };

    // Amint sikeres a belépés vagy változik a hónap, frissítünk
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Dátumszűrők az adott hónapra (Pl. 2026-03)
            const [year, month] = selectedMonth.split('-');
            const startDate = new Date(year, parseInt(month) - 1, 1).toISOString();
            const endDate = new Date(year, parseInt(month), 0, 23, 59, 59).toISOString();

            // 2. Számlák (invoices) lekérése erre a hónapra
            const { data: invoices, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('billing_period', selectedMonth);
            
            if (invError) throw invError;
            const invoiceMap = {};
            if (invoices) {
                invoices.forEach(inv => {
                    invoiceMap[inv.restaurant_id] = inv;
                });
            }

            // 3. Kiszállított rendelések lekérése az adott hónapban
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('restaurant_id, total_price, created_at')
                .eq('status', 'delivered')
                .gte('created_at', startDate)
                .lte('created_at', endDate);
                
            if (ordersError) throw ordersError;

            // 4. Éttermek (előfizetési díjjal) lekérése
            const { data: restaurants, error: restError } = await supabase
                .from('restaurants')
                .select('id, name, subscription_type, subscription_fee');
                
            if (restError) throw restError;

            const restMap = {};
            restaurants.forEach(r => {
                restMap[r.id] = { 
                    id: r.id, 
                    name: r.name, 
                    totalRevenue: 0, 
                    orderCount: 0,
                    subscription_type: r.subscription_type || 'Üres',
                    subscription_fee: r.subscription_fee || 0,
                    invoice: invoiceMap[r.id] || null
                };
            });

            // 5. Rendelések aggregálása
            orders.forEach(o => {
                if (restMap[o.restaurant_id]) {
                    restMap[o.restaurant_id].totalRevenue += o.total_price;
                    restMap[o.restaurant_id].orderCount += 1;
                }
            });

            // Minden étterem listázása (forgalom nélküliek is)
            const statsList = Object.values(restMap).sort((a,b) => b.totalRevenue - a.totalRevenue);
            setData(statsList);

        } catch (error) {
            console.error(error);
            toast.error('Hiba az adatok letöltésekor. Futtattad az SQL-t a Supabase-ben?');
        } finally {
            setLoading(false);
        }
    };

    // Számla "generálása" az adatbázisban (1 hetes határidővel)
    const generateInvoice = async (restaurant) => {
        const commission = Math.floor(restaurant.totalRevenue * 0.05);
        const totalDue = commission + restaurant.subscription_fee;
        
        // Határidő: Mai nap + 7 nap
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const payload = {
            restaurant_id: restaurant.id,
            billing_period: selectedMonth,
            total_revenue: restaurant.totalRevenue,
            commission_amount: commission,
            subscription_type: restaurant.subscription_type,
            subscription_amount: restaurant.subscription_fee,
            total_due: totalDue,
            status: 'pending',
            due_date: dueDate.toISOString()
        };

        const { error } = await supabase.from('invoices').insert([payload]);
        if (error) {
            toast.error('Hiba a számla kiállításakor!');
            console.error(error);
        } else {
            toast.success(`Számla rögzítve a(z) ${restaurant.name} számára!`);
            fetchData(); // Újratöltjük az asztalt
        }
    };

    // Számla fizetettre állítása ("Megérkezett")
    const markAsPaid = async (invoiceId) => {
        const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', invoiceId);
        
        if (error) {
            toast.error('Hiba a rögzítéskor!');
        } else {
            toast.success('Befizetés sikeresen leigazolva! ✅');
            fetchData();
        }
    };

    // Segédfüggvény a lejárat ellenőrzésére
    const isOverdue = (dueDateStr) => {
        return new Date(dueDateStr) < new Date();
    };

    // Megjelenítés hónap szerkesztő
    const generateMonthOptions = () => {
        const options = [];
        const start = new Date(2025, 0); // Modul indulása pl. 2025 Jan
        const end = new Date(2028, 11);
        let curr = new Date(start);
        while (curr <= end) {
            const m = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
            options.push(m);
            curr.setMonth(curr.getMonth() + 1);
        }
        return options;
    };


    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#1a1c2e] p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                        <IoLockClosed className="text-3xl text-white drop-shadow-md" />
                    </div>
                    
                    <h1 className="relative z-10 text-2xl font-black text-white text-center mb-8">SUPER<span className="text-amber-500">ADMIN</span></h1>
                    
                    <div className="relative z-10 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1 block">Rendszergazda ID</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-amber-500/50 transition-colors shadow-inner" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1 block">Titkos Jelszó</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-amber-500/50 transition-colors shadow-inner" />
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30">
                                BELÉPÉS A KÖZPONTBA
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f111a] pb-24 pt-8 px-4 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#1a1c2e] p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                            <IoTrendingUp className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">KőszegApp <span className="text-amber-500">Pénzügy</span></h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Havi számlázás és jutalék elszámolás (5% + Előfizetés)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/20 p-2 pl-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
                            <IoCalendar /> Hónap:
                        </div>
                        <select 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-white dark:bg-[#111] text-slate-800 dark:text-white border-2 border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 font-bold outline-none focus:border-amber-500 cursor-pointer"
                        >
                            {generateMonthOptions().reverse().map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => setIsAuthenticated(false)} 
                            className="w-10 h-10 ml-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all shadow-sm"
                            title="Kilépés"
                        >
                            <IoLogOut className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Details Table */}
                <div className="bg-white dark:bg-[#1a1c2e] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex justify-between items-center">
                        <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Partneri Elszámolás - {selectedMonth}
                        </h2>
                        <button onClick={fetchData} className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors">🔄 Frissítés</button>
                    </div>
                    
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Adatbázis szinkronizálása...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#111]/30">
                                    <tr>
                                        <th className="py-4 px-6 font-bold">Étterem</th>
                                        <th className="py-4 px-3 font-bold text-center">Rendelések</th>
                                        <th className="py-4 px-3 font-bold text-right border-r border-black/5 dark:border-white/5">Havi Forgalom</th>
                                        <th className="py-4 px-3 font-bold text-right text-amber-600">Jutalék (5%)</th>
                                        <th className="py-4 px-3 font-bold text-right text-blue-600">Előfizetés</th>
                                        <th className="py-4 px-3 font-bold text-right text-green-600 bg-green-50/50 dark:bg-green-900/10 border-l border-black/5 dark:border-white/5">Fizetendő DÍJ</th>
                                        <th className="py-4 px-6 font-bold text-center">Pénzügyi Státusz & Akciók</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {data.map((row) => {
                                        const commission = Math.floor(row.totalRevenue * 0.05);
                                        const totalDue = commission + row.subscription_fee;
                                        const invoice = row.invoice;

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-sm text-slate-800 dark:text-white">{row.name}</div>
                                                </td>
                                                <td className="py-4 px-3 font-medium text-sm text-center text-slate-500">
                                                    <span className="bg-slate-100 dark:bg-black/20 px-2 py-1 rounded-lg">{row.orderCount} db</span>
                                                </td>
                                                <td className="py-4 px-3 font-mono font-medium text-sm text-right text-slate-600 dark:text-slate-300 border-r border-black/5 dark:border-white/5">
                                                    {row.totalRevenue.toLocaleString()} Ft
                                                </td>
                                                <td className="py-4 px-3 font-black text-sm text-right text-amber-600 dark:text-amber-500">
                                                    {commission.toLocaleString()} Ft
                                                </td>
                                                <td className="py-4 px-3 font-bold text-xs text-right text-blue-600 dark:text-blue-400">
                                                    <div>{row.subscription_fee.toLocaleString()} Ft</div>
                                                    <div className="text-[9px] uppercase opacity-70 mt-1">{row.subscription_type}</div>
                                                </td>
                                                <td className="py-4 px-3 font-black text-lg text-right text-green-600 dark:text-green-500 bg-green-50/30 dark:bg-green-900/10 border-l border-black/5 dark:border-white/5 tracking-tight">
                                                    {totalDue.toLocaleString()} Ft
                                                </td>
                                                
                                                {/* INVOICE STATUS COLUMN */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        {!invoice ? (
                                                            <button 
                                                                onClick={() => generateInvoice(row)}
                                                                className="w-full bg-slate-800 dark:bg-white text-white dark:text-black text-xs font-bold py-2 rounded-xl hover:scale-[1.02] active:scale-95 transition-transform"
                                                            >
                                                                🧾 Számla Kiállítása
                                                            </button>
                                                        ) : invoice.status === 'paid' ? (
                                                            <div className="w-full flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 py-2 rounded-xl text-xs font-bold border border-green-200 dark:border-green-800">
                                                                <IoCheckmarkCircle className="text-lg" /> Befizetve
                                                            </div>
                                                        ) : (
                                                            // Pending or Overdue
                                                            <div className="w-full flex items-center bg-slate-100 dark:bg-[#111] rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
                                                                <div className={`flex-1 flex flex-col items-center justify-center p-2 text-center border-r border-black/5 dark:border-white/5 ${isOverdue(invoice.due_date) ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-amber-600'}`}>
                                                                    {isOverdue(invoice.due_date) ? (
                                                                        <><IoWarning className="text-xl mx-auto mb-1 animate-pulse" /><span className="text-[9px] font-black uppercase">Lejárt Tartozás!</span></>
                                                                    ) : (
                                                                        <><IoTime className="text-xl mx-auto mb-1" /><span className="text-[9px] font-black uppercase">Kifizetésre Vár</span></>
                                                                    )}
                                                                </div>
                                                                <button 
                                                                    onClick={() => markAsPaid(invoice.id)}
                                                                    className="px-4 py-4 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors tooltip title='Fizetés leigazolása'"
                                                                    title="Megérkezett (Pénz jóváírása)"
                                                                >
                                                                    <IoCheckmarkCircle className="text-2xl" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center text-slate-400 text-sm font-medium">Nincs éttermi adat.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
