import { useLocation, useNavigate } from 'react-router-dom';

export default function BackToHome() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/') return null;

  return (
    <button
      onClick={() => navigate('/')}
      aria-label="Vissza a főoldalra"
      className="w-12 h-12 rounded-full bg-[#52a5dd] shadow-xl flex items-center justify-center text-white text-2xl
                   transition-all duration-300 hover:scale-110 active:scale-95 animate-floating backdrop-blur-sm"
    >
      ⬅️
    </button>
  );
}
