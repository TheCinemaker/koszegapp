import React from 'react';

/**
 * A beautiful fallback "Ghost" image for items without a photo.
 * Features a vibrant gradient background and a subtle, floating Kőszeg Logo.
 */
export default function GhostImage({ className = "w-full h-full" }) {
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center ${className}`}>
            {/* Abstract Shapes/Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            {/* Floating Ghost Logo */}
            <img
                src="/images/koeszeg_logo_nobg.png"
                alt="Kőszeg Placeholder"
                className="w-1/3 h-auto max-w-[150px] opacity-20 blur-[1px] drop-shadow-2xl animate-pulse-slow"
            />

            {/* "No Image" Text Hint (Optional, keeping it purely visual for now is better) */}
        </div>
    );
}
