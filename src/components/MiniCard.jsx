import React from 'react';
import { Link } from 'react-router-dom';

export default function MiniCard({ to, imageSrc, title, subtitle }) {
    return (
        <Link
            to={to}
            className="flex-shrink-0 w-48 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-md overflow-hidden snap-start transition-transform hover:-translate-y-1 block"
        >
            <img
                src={imageSrc}
                alt={title}
                className="w-full h-24 object-cover"
                // Add basic error handling for placeholders if needed
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/koeszeg_logo_nobg.png'; }}
            />
            <div className="p-2">
                <h4 className="font-semibold text-sm truncate text-purple-900 dark:text-purple-300">{title}</h4>
                {subtitle && (
                    <div className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        </Link>
    );
}
