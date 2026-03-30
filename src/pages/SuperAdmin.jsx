import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { IoLockClosed, IoTrendingUp, IoRestaurant, IoWallet, IoLogOut } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function SuperAdmin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCommission, setTotalCommission] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const handleLogin = (e) => {
        e.preventDefault();
        // Szigorú beégetett azonosítás az ügyfél kérésére
        if (username === 'TheCinemaker' && password === 'Nyanyuska_0169') {
            setIsAuthenticated(true);
            fetchData();
        } else {
            toast.error('Hibás hitelesítő adatok!');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch delivered orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('restaurant_id, total_price, created_at')
                .eq('status', 'delivered');
                
            if (ordersError) throw ordersError;

            // Fetch restaurants to map IDs to Names
            const { data: restaurants, error: restError } = await supabase
                .from('restaurants')
                .select('id, name');
                
            if (restError) throw restError;

            const restMap = {};
            restaurants.forEach(r => {
                restMap[r.id] = { name: r.name, total: 0, count: 0 };
            });

            let globalRevenue = 0;

            orders.forEach(o => {
                if (restMap[o.restaurant_id]) {
                    restMap[o.restaurant_id].total += o.total_price;
                    restMap[o.restaurant_id].count += 1;
                    globalRevenue += o.total_price;
                }
            });

            // Csak azokat mutatjuk, akiknek volt rendelése
            const statsList = Object.values(restMap).filter(r => r.total > 0).sort((a,b) => b.total - a.total);

            setData(statsList);
            setTotalRevenue(globalRevenue);
            setTotalCommission(globalRevenue * 0.05);

        } catch (error) {
            console.error(error);
            toast.error('Hiba az adatok letöltésekor');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#1a1c2e] p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/5 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                        <IoLockClosed className="text-3xl text-white drop-shadow-md" />
                    </div>
                    
                    <h1 className="relative z-10 text-2xl font-black text-white text-center mb-8">SUPER<span className="text-amber-500">ADMIN</span></h1>
                    
                    <div className="relative z-10 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1 block">Rendszergazda ID</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-amber-500/50 transition-colors shadow-inner" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1 block">Titkos Jelszó</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-amber-500/50 transition-colors shadow-inner" 
                            />
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
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex justify-between items-center bg-white dark:bg-[#1a1c2e] p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                <IoTrendingUp className="text-xl" />
                            </div>
                            KőszegApp <span className="text-amber-500">Pénzügy</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 ml-1">Kiszállított rendelések jutalék elszámolása éttermenként</p>
                    </div>
                    <button 
                        onClick={() => setIsAuthenticated(false)} 
                        className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all shadow-sm"
                        title="Kilépés"
                    >
                        <IoLogOut className="text-xl" />
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Platform Revenue */}
                    <div className="bg-white dark:bg-[#1a1c2e] rounded-[2rem] p-6 border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-[2rem]" />
                        <div className="relative z-10 pl-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                                <IoRestaurant className="text-blue-500 text-sm" /> Ételrendelés Forgalom
                            </div>
                            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                {totalRevenue.toLocaleString()} <span className="text-xl text-slate-400">Ft</span>
                            </div>
                        </div>
                    </div>

                    {/* Own Commission */}
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] p-6 shadow-xl shadow-amber-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-white/10 text-9xl rotate-12 pointer-events-none"><IoWallet /></div>
                        <div className="relative z-10 w-full flex flex-col justify-center h-full">
                            <div className="flex items-center gap-2 text-white/90 font-bold uppercase tracking-widest text-[10px] mb-2 drop-shadow-sm">
                                <IoWallet className="text-sm" /> Teljes Kiszámlázandó Jutalék (5%)
                            </div>
                            <div className="text-4xl font-black text-white drop-shadow-md tracking-tight">
                                {totalCommission.toLocaleString()} <span className="text-2xl text-white/70">Ft</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Table */}
                <div className="bg-white dark:bg-[#1a1c2e] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex justify-between items-center">
                        <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">Részletes Elszámolás (Adatbázis Éles)</h2>
                        <button onClick={fetchData} className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors">Frissítés</button>
                    </div>
                    
                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Adatok aggregálása...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    <tr>
                                        <th className="py-4 px-6 font-bold">Étterem Neve</th>
                                        <th className="py-4 px-6 font-bold text-center">Rendelések (db)</th>
                                        <th className="py-4 px-6 font-bold text-right">Bevétel</th>
                                        <th className="py-4 px-6 font-bold text-right text-amber-500">Jutalékod (5%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {data.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="py-4 px-6 font-bold text-sm text-slate-800 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-black/20 flex items-center justify-center text-slate-400 text-xs">
                                                    {i + 1}.
                                                </div>
                                                {row.name}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-sm text-center text-slate-500 dark:text-slate-400">
                                                <span className="bg-slate-100 dark:bg-black/20 px-2 py-1 rounded-lg">{row.count}</span>
                                            </td>
                                            <td className="py-4 px-6 font-mono font-medium text-sm text-right text-slate-600 dark:text-slate-300">
                                                {row.total.toLocaleString()} Ft
                                            </td>
                                            <td className="py-4 px-6 font-black text-sm text-right text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/10 group-hover:bg-transparent transition-colors">
                                                {(row.total * 0.05).toLocaleString()} Ft
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-16 text-center text-slate-400 text-sm font-medium">Nincs még megjeleníthető adat a rendszerben.</td>
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
