import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
    const location = useLocation();
    const isInGameMode = location.pathname.startsWith('/game/') || location.pathname.startsWith('/gem/');

    if (isInGameMode) return null;

    return (
        <footer className="mt-auto bg-white/10 dark:bg-gray-900/10 backdrop-blur-3xl border-t border-white/10 dark:border-gray-700/10 text-center py-4 sm:py-5 z-40 transition-all duration-300">
            <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                    © 2026
                    <a
                        href="mailto:koszegapp@gmail.com"
                        className="font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                        SA Software & Network Solutions
                    </a>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2">
                    <span>Design: Hidalmasi Erik</span>
                    <span className="opacity-50">•</span>
                    <span className="opacity-70">✨ with AI</span>
                    <span className="opacity-50">•</span>
                    <Link to="/adatvedelem" className="opacity-50 hover:opacity-100 transition-opacity hover:text-indigo-500">Adatvédelem</Link>
                    <span className="opacity-50">•</span>
                    <span className="opacity-30">v2.0</span>
                </p>
            </div>
            {/* Extra spacing for FloatingNavbar */}
            <div className="h-20" />
        </footer>
    );
}
