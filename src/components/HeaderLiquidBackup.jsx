import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCloudSun, FaMap, FaHeart, FaMoon, FaSun } from 'react-icons/fa';
import FavoritesDashboard from './FavoritesDashboard';

// EZ EGY BACKUP KOMPONENS A LIQUID HEADERHEZ (FontAwesome Ikonokkal)
// Ha a user visszakéri, innen visszaállítható.
export default function HeaderLiquidBackup({
    isInGameMode,
    dark,
    toggleDark,
    weather,
    favoritesCount,
    showFavorites,
    setShowFavorites,
    setShowWeatherModal,
    favoritesRef,
    favoriteAttractions,
    favoriteEvents,
    favoriteLeisure,
    favoriteRestaurants
}) {
    const navigate = useNavigate();

    if (isInGameMode) return null;

    return (
        <header className="fixed top-4 left-4 right-4 h-16 sm:h-20 z-50 transition-all duration-300 pointer-events-none flex justify-center">
            <div className="
              pointer-events-auto
              w-full max-w-5xl
              h-full
              flex items-center justify-between px-4 sm:px-6
              bg-white/40 dark:bg-[#1a1c2e]/40 
              backdrop-blur-[25px] 
              backdrop-saturate-[1.8]
              backdrop-brightness-[1.1]
              rounded-[2.5rem] 
              border border-white/50 dark:border-white/20 
              shadow-[0_10px_40px_rgba(0,0,0,0.1)]
              relative overflow-hidden
            ">
                {/* Subtle Gradient Accent (Top Lip) */}
                <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />

                <div className="flex items-center gap-2 sm:gap-3">
                    <img
                        onClick={() => navigate('/')}
                        src="/images/koeszeg_logo_nobg.png"
                        alt="KőszegAPP logo"
                        className="w-8 h-8 sm:w-11 sm:h-11 hover:rotate-12 transition-transform duration-500 cursor-pointer drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] dark:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    />
                    <span
                        onClick={() => navigate('/')}
                        className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer"
                    >
                        KőszegAPP
                    </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Weather Button */}
                    <button
                        onClick={() => setShowWeatherModal(true)}
                        className="flex items-center gap-2 h-9 sm:h-10 px-3 rounded-xl
                             bg-gradient-to-br from-cyan-400 to-blue-600
                             text-white shadow-lg
                             hover:from-cyan-500 hover:to-blue-700
                             transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <FaCloudSun className="text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm font-bold">{weather.temp}°C</span>
                    </button>

                    {/* Map Button */}
                    <Link
                        to="/live-map"
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl
                             bg-gradient-to-br from-purple-500 to-indigo-600
                             text-white shadow-lg
                             hover:from-purple-600 hover:to-indigo-700
                             transition-all duration-300 hover:scale-105 active:scale-95"
                        aria-label="Térkép"
                    >
                        <FaMap className="text-sm sm:text-base" />
                    </Link>

                    {/* Favorites Button */}
                    <div className="relative" ref={favoritesRef}>
                        <button
                            onClick={() => setShowFavorites(!showFavorites)}
                            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl
                               bg-gradient-to-br from-pink-500 to-rose-600
                               text-white shadow-lg
                               hover:from-pink-600 hover:to-rose-700
                               transition-all duration-300 hover:scale-105 active:scale-95"
                            aria-label="Kedvencek megnyitása"
                        >
                            <FaHeart className="text-sm sm:text-base" />
                            {favoritesCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                                    {favoritesCount}
                                </span>
                            )}
                        </button>

                        {showFavorites && (
                            <FavoritesDashboard
                                attractions={favoriteAttractions}
                                events={favoriteEvents}
                                leisure={favoriteLeisure}
                                restaurants={favoriteRestaurants}
                                onClose={() => setShowFavorites(false)}
                            />
                        )}
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDark}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl
                             bg-gradient-to-br from-gray-700 to-gray-900 dark:from-yellow-400 dark:to-orange-500
                             text-white shadow-lg
                             hover:scale-105 active:scale-95
                             transition-all duration-300"
                        aria-label="Sötét mód váltása"
                    >
                        {dark ? <FaSun className="text-sm sm:text-base" /> : <FaMoon className="text-sm sm:text-base" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
