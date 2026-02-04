import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient'; // Import direct client

const ROLES = [
    { id: 'admin', label: 'Adminisztrátor (Full Access)', nickname: 'admin' },
    { id: 'varos', label: 'Kőszeg Város (Events, Info)', nickname: 'varos' },
    { id: 'var', label: 'Kőszegi Vár (Own Events)', nickname: 'var' },
    { id: 'tourinform', label: 'Tourinform (Tourism)', nickname: 'tourinform' },
    { id: 'partner', label: 'Külsős Partner (Limited)', nickname: 'kulsos' },
];

export default function SecretRegister() {
    const { register } = useAuth();
    const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
    const [customSuffix, setCustomSuffix] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [useMinimal, setUseMinimal] = useState(true); // Toggle for debug

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        const roleConfig = ROLES.find(r => r.id === selectedRole);
        if (!roleConfig) return;

        try {
            const cleanSuffix = customSuffix.trim().replace(/[^a-zA-Z0-9]/g, '');
            const finalNickname = cleanSuffix ? `${roleConfig.nickname}_${cleanSuffix}` : roleConfig.nickname;

            // Generate email manually for direct test
            const prefix = roleConfig.id === 'partner' || roleConfig.id.startsWith('provider') ? 'provider' : 'client';
            const email = `${prefix}.${finalNickname}@koszeg.app`;

            if (useMinimal) {
                // 1. TRY MINIMAL: No metadata, just email/pass. 
                // This tests if the DB trigger fails even on basic insert.
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    // Intentionally SKIPPING options.data
                });
                if (error) throw error;

                if (data?.user) {
                    toast.success(`1. Lépés OK: User létrejött!`);

                    // 2. PHASE: Attempt to PATCH the missing metadata manually
                    try {
                        const { error: updateError } = await supabase.auth.updateUser({
                            data: {
                                role: roleConfig.id,
                                full_name: roleConfig.label,
                                nickname: finalNickname
                            }
                        });
                        if (updateError) {
                            console.error("Metaadat javítás hiba:", updateError);
                            toast.error("User OK, de a Jogosultság beállítása nem sikerült.");
                        } else {
                            toast.success("2. Lépés OK: Admin jogok beállítva! 🚀");
                        }
                    } catch (err) {
                        console.error("Patch error:", err);
                    }
                } else {
                    toast.error('Nem jött létre user objektum?');
                }
            } else {
                // 2. ORIGINAL FULL
                await register(finalNickname, password, roleConfig.label, roleConfig.id);
                toast.success(`Teljes regisztráció sikerült: ${finalNickname}`);
            }

            setPassword('');
        } catch (error) {
            console.error(error);
            toast.error(`Hiba: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-2xl">
                <h1 className="text-2xl font-bold mb-2 text-red-500">⚠️ Titkos Regisztráció</h1>
                <p className="text-neutral-400 text-sm mb-6">
                    Ez az oldal a kezdeti admin/szolgáltató fiókok létrehozására szolgál.
                    Csak fejlesztői használatra!
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mb-4">
                    <label className="flex items-center space-x-2 text-sm text-yellow-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useMinimal}
                            onChange={e => setUseMinimal(e.target.checked)}
                            className="w-4 h-4 rounded bg-neutral-900 border-neutral-600 focus:ring-yellow-500"
                        />
                        <span>"Butított" mód (Metaadatok nélkül) - Debug célra</span>
                    </label>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                            Fiók Típus (Role)
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            {ROLES.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.label} ({role.nickname})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                            Egyedi Utótag (pl. &quot;2&quot; → admin_2)
                        </label>
                        <input
                            type="text"
                            value={customSuffix}
                            onChange={(e) => setCustomSuffix(e.target.value)}
                            className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="pl. 2"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                            Jelszó (amit használni fognak)
                        </label>
                        <input
                            type="text" // Show text to avoid typos during setup
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none font-mono"
                            placeholder="pl. secret123"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Létrehozás...' : 'Fiók Létrehozása'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-700">
                    <h3 className="text-xs font-bold uppercase text-neutral-500 mb-2">Generált Email Formátum:</h3>
                    <code className="block bg-black/30 p-3 rounded text-xs text-green-400 font-mono">
                        {/* AuthContext logic: isProvider = role === 'provider' */}
                        {(selectedRole === 'provider' ? 'provider' : 'client')}.
                        {ROLES.find(r => r.id === selectedRole)?.nickname}
                        {customSuffix ? `_${customSuffix.replace(/[^a-zA-Z0-9]/g, '')}` : ''}
                        @koszeg.app
                    </code>
                    <p className="text-xs text-neutral-500 mt-2">
                        A <code>login.js</code>-ben lévő Netlify Function Auth-ot ez a Supabase regisztráció kiváltja a frontend oldalon, de a backend ellenőrzésnél (save-github-json) a Supabase token működni fog.
                    </p>
                </div>
            </div>
        </div>
    );
}
