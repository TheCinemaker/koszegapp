import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUtensils,
    FaCloudSun,
    FaRunning,
    FaBed,
    FaParking,
    FaInfoCircle,
    FaGem,
    FaArrowLeft // ADDED
} from 'react-icons/fa';

const RAW_NAV_ITEMS = [
    { to: '/events', label: 'Események', icon: FaCalendarAlt, gradient: 'gradient-cosmic' },
    { to: '/attractions', label: 'Látnivalók', icon: FaMapMarkerAlt, gradient: 'gradient-sunset' },
    { to: '/gastronomy', label: 'Gasztró', icon: FaUtensils, gradient: 'gradient-fire' },
    { to: '/weather', label: 'Időjárás', icon: FaCloudSun, gradient: 'gradient-ocean' },
    { to: '/leisure', label: 'Szabadidő', icon: FaRunning, gradient: 'gradient-nature' },
    { to: '/hotels', label: 'Szállás', icon: FaBed, gradient: 'gradient-luxury' },
    { to: '/parking', label: 'Parkolás', icon: FaParking, gradient: 'gradient-metal' },
    { to: '/info', label: 'Infó', icon: FaInfoCircle, gradient: 'gradient-mystic' },
    { to: '/game/intro', label: 'KőszegQuest', icon: FaGem, gradient: 'gradient-gold' },
];

export default function UniversalNav() {
    const location = useLocation();
    const navigate = useNavigate();

    // Find the active item based on current path
    const activeItem = useMemo(() => {
        return RAW_NAV_ITEMS.find(item =>
            location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
        );
    }, [location.pathname]);

    // If no matching page (e.g. Home or unknown), render nothing or a generic placeholder?
    // User asked for "one tile" under the header. If we are on Home, maybe we don't show it?
    // Assuming this component is used on subpages.
    if (!activeItem) return null;

    return (
        <div className="flex justify-center items-center w-full px-4 mb-2 gap-3">
            {/* BACK BUTTON (Square Tile) - Now matches theme */}
            <div
                onClick={() => navigate('/')}
                className={`
                    active:scale-95 transition-all duration-300
                    w-12 h-12 rounded-2xl 
                    flex items-center justify-center 
                    shadow-lg cursor-pointer 
                    border border-white/20
                    relative overflow-hidden
                `}
            >
                {/* Background Gradient (Same as Title but separate tile) */}
                <div className={`absolute inset-0 ${activeItem.gradient} opacity-100`} />

                <FaArrowLeft className="relative z-10 text-white text-lg drop-shadow-md" />
            </div>

            {/* 
                SINGLE PAGE TILE (Page Indicator)
            */}
            <div
                className={`
                    relative 
                    w-1/2 min-w-[160px] max-w-[240px] 
                    h-12 
                    rounded-2xl 
                    flex items-center justify-center 
                    shadow-lg
                    overflow-hidden
                `}
            >
                {/* Background Gradient - FULL OPACITY */}
                <div className={`absolute inset-0 ${activeItem.gradient}`} />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3">
                    <activeItem.icon className="text-white text-xl drop-shadow-md" />
                    <span className="font-bold text-sm uppercase tracking-wide text-white drop-shadow-md">
                        {activeItem.label}
                    </span>
                </div>
            </div>
        </div>
    );
}
