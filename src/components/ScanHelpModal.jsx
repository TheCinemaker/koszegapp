import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaTimes, FaQrcode } from 'react-icons/fa';

export default function ScanHelpModal({ onClose }) {
  const navigate = useNavigate();

  const handleSimulateScan = () => {
    // Demo mód: egyenesen a Jézus Szíve templomhoz
    navigate('/game/gem/jezus-szive');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadein-fast" onClick={onClose}>
      {/* Spyglass / Optic Overlay Frame */}
      <div
        className="max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brass Ring Border */}
        <div className="absolute inset-0 rounded-full border-[12px] border-[#8b5a2b] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none z-20 hidden md:block" style={{ borderRadius: '40% 40% 40% 40% / 50% 50% 50% 50%' }}></div>

        {/* Main Content Box (Paper/Glass style) */}
        <div className="bg-[#2c1810] border-4 border-[#8b5a2b] rounded-xl p-8 text-center relative overflow-hidden shadow-2xl">
          {/* Glass Reflection Effect */}
          <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none"></div>

          <div className="mb-6 flex justify-center relative z-10">
            <div className="w-20 h-20 bg-[#3e2723] rounded-full flex items-center justify-center border-2 border-[#8b5a2b] shadow-inner">
              <FaQrcode className="text-4xl text-[#f4e4bc] opacity-80" />
            </div>
          </div>

          <h2 className="text-3xl font-zeyada text-[#f4e4bc] mb-2 drop-shadow-md">A Varázslencse</h2>
          <p className="text-[#e6dbb9] font-serif italic text-sm mb-8 opacity-80 leading-relaxed">
            "Emeld a lencsét a városban elrejtett jelek fölé, hogy felfedd a múlt titkait."
          </p>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#3e2723]/50 p-4 border border-[#5c3a1e] rounded text-left group cursor-default shadow-inner">
              <h3 className="text-[#f4e4bc] font-bold font-serif text-sm uppercase mb-1 flex items-center gap-2">
                <FaCamera className="text-[#a06a35]" /> Keresés a Látómezőben
              </h3>
              <p className="text-xs text-[#d7ccc8] font-serif leading-relaxed italic opacity-80">
                Használd a készülékedet a jelek (QR kódok) megvizsgálásához.
              </p>
            </div>

            <div className="relative">
              <button
                onClick={handleSimulateScan}
                className="relative w-full bg-[#8b5a2b] hover:bg-[#a06a35] text-[#f4e4bc] font-bold py-4 px-6 shadow-lg transition-all flex items-center justify-center gap-3 font-serif uppercase tracking-widest border-2 border-[#5c3a1e] rounded group"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span>[ Próba Varázslat ]</span>
              </button>
              <div className="text-[10px] text-center text-[#a06a35] mt-1 font-serif italic">szimulációs mód</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 text-[#8d6e63] hover:text-[#f4e4bc] transition text-xs font-serif uppercase tracking-widest"
            >
              ( Visszatétel a táskába )
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
