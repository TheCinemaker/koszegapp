import React, { useEffect, useState } from 'react';
import { IoClose, IoPhonePortraitOutline, IoShareOutline, IoAddCircleOutline } from 'react-icons/io5';

const DISMISS_KEY = 'kp_a2hs_dismissed';

/**
 * AddToHomeHint – "Tedd ki a kezdőképernyőre" tipp a KőszegPass oldalon.
 *
 * A Wallet-alternatíva azoknak, akik nem ismerik az Apple/Google Walletet:
 * a kártya (a jelenlegi token-es URL) egy koppintással kikerül a főképernyőre.
 *
 * - Ha az app már "telepítve" fut (standalone mód) → nem jelenik meg.
 * - Ha a felhasználó bezárta → localStorage-ban megjegyzi, nem nyaggat újra.
 * - Androidon a natív install prompttal (beforeinstallprompt) valódi gombot ad.
 * - iOS-en (nincs programozott prompt) a Megosztás → Kezdőképernyőhöz adás lépést mutatja.
 */
export default function AddToHomeHint() {
    const [visible, setVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Már telepítve (standalone)? Akkor nincs teendő.
        const standalone =
            window.matchMedia?.('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (standalone) return;

        // Korábban bezárta?
        if (localStorage.getItem(DISMISS_KEY) === '1') return;

        const ua = window.navigator.userAgent || '';
        const iOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
        const android = /android/i.test(ua);

        // Csak mobilon van értelme
        if (!iOS && !android) return;

        setIsIOS(iOS);
        setVisible(true);

        // Android: natív install prompt elkapása
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setVisible(false);
    };

    const handleAndroidInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        try {
            await deferredPrompt.userChoice;
        } catch {
            /* felhasználó elutasította – nincs teendő */
        }
        setDeferredPrompt(null);
        dismiss();
    };

    if (!visible) return null;

    return (
        <div className="relative bg-white/5 border border-[#C8AF64]/25 rounded-2xl p-4 mb-6 text-left">
            <button
                onClick={dismiss}
                aria-label="Bezárás"
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-blue-200/50 hover:text-white hover:bg-white/10 transition-colors"
            >
                <IoClose size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
                <IoPhonePortraitOutline className="text-[#C8AF64] text-base shrink-0" />
                <p className="text-xs font-bold text-white">Tedd ki a kezdőképernyőre</p>
            </div>
            <p className="text-[10px] text-blue-100/55 leading-relaxed mb-3">
                Így egy koppintással bármikor előhúzod a kártyád – Wallet nélkül, mint egy appot.
            </p>

            {isIOS ? (
                <div className="flex items-center gap-2 text-[10px] text-blue-100/75 bg-black/20 rounded-lg px-3 py-2">
                    <span>Koppints a</span>
                    <IoShareOutline className="text-[#C8AF64] text-sm" />
                    <span>Megosztás ikonra, majd:</span>
                    <IoAddCircleOutline className="text-[#C8AF64] text-sm" />
                    <span className="font-semibold text-white">Kezdőképernyőhöz adás</span>
                </div>
            ) : deferredPrompt ? (
                <button
                    onClick={handleAndroidInstall}
                    className="w-full bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] font-black h-10 rounded-lg text-xs transition-colors"
                >
                    Hozzáadás a kezdőképernyőhöz
                </button>
            ) : (
                <div className="flex items-center gap-2 text-[10px] text-blue-100/75 bg-black/20 rounded-lg px-3 py-2">
                    <span>Nyisd meg a böngésző menüjét (⋮), majd:</span>
                    <span className="font-semibold text-white">Hozzáadás a kezdőképernyőhöz</span>
                </div>
            )}
        </div>
    );
}
