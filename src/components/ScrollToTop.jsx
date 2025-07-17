import React, { useState, useEffect } from 'react';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    visible && (
      <button
        onClick={scrollToTop}
        className="w-12 h-12 rounded-full bg-[#52a5dd] shadow-xl flex items-center justify-center text-white text-2xl
                   transition-all duration-300 hover:scale-110 active:scale-95 animate-floating backdrop-blur-sm"
      >
        ⬆️
      </button>
    )
  );
}
