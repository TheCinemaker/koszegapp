import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { triggerHaptic } from '../utils/haptics';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.pageYOffset > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    triggerHaptic();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {visible && (
        <button
          onClick={scrollToTop}
          className="w-10 h-10 sm:w-12 sm:h-12
                     bg-gradient-to-br from-indigo-500/50 to-purple-600/50
                     hover:from-indigo-600 hover:to-purple-700
                     text-white rounded-xl
                     flex items-center justify-center
                     shadow-lg hover:shadow-xl
                     transition-all duration-300
                     hover:scale-105 active:scale-95
                     backdrop-blur-sm
                     border border-white/20
                     z-50"
          aria-label="Vissza a tetejére"
        >
          <FaArrowUp className="text-sm sm:text-lg" />
        </button>
      )}
    </>
  );
}
