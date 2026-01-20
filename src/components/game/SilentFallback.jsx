import { useEffect, useState } from 'react';

export default function SilentFallback() {
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // 5 minutes
        const t1 = setTimeout(() => {
            setMessage('A város jelei nem mindig ott vannak, ahol keresed.');
        }, 5 * 60 * 1000);

        // 10 minutes
        const t2 = setTimeout(() => {
            setMessage('Ha elindulnál, a Főtér környéke jó kezdet.');
        }, 10 * 60 * 1000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    if (!message) return null;

    return (
        <div className="
            fixed bottom-6 left-1/2 -translate-x-1/2 w-full text-center
            text-[10px]
            uppercase
            tracking-[0.3em]
            text-white/40
            opacity-50
            pointer-events-none
            transition-opacity duration-1000
        ">
            {message}
        </div>
    );
}
