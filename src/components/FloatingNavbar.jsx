import { triggerHaptic } from '../utils/haptics'; // Import utility
import { useTranslation } from 'react-i18next'; // Hook
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  IoHomeOutline, IoHome,
  IoCalendarOutline, IoCalendar,
  IoTicketOutline, IoTicket,
  IoMapOutline, IoMap,
  IoPersonCircleOutline, IoPersonCircle,
  IoKeyOutline, IoKey
} from 'react-icons/io5';

export default function FloatingNavbar() {
  const { t } = useTranslation(); // Hook
  const { user } = useAuth();

  // Dynamic Auth Item
  const authItem = user
    ? { to: "/pass/profile", icon: IoPersonCircleOutline, activeIcon: IoPersonCircle, label: t('nav.profile') }
    : { to: "/pass/register", icon: IoKeyOutline, activeIcon: IoKey, label: t('nav.login') };

  // 5 fixed navigation items — no horizontal scrolling
  const navItems = [
    { to: "/", icon: IoHomeOutline, activeIcon: IoHome, label: t('nav.home') },
    { to: "/events", icon: IoCalendarOutline, activeIcon: IoCalendar, label: t('nav.events') },
    { to: "/tickets", icon: IoTicketOutline, activeIcon: IoTicket, label: t('nav.tickets') || 'Jegyek' },
    { to: "/live-map", icon: IoMapOutline, activeIcon: IoMap, label: t('nav.map') },
    authItem,
  ];

  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-[95vw] sm:max-w-md pointer-events-none">
      <div className="
        pointer-events-auto
        flex items-center justify-around
        px-3 py-2
        bg-white/30 dark:bg-white/10
        backdrop-blur-[30px] backdrop-saturate-150
        rounded-2xl
        border border-white/60 dark:border-white/10
        shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        transition-colors duration-300
      ">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => triggerHaptic()}
            className={({ isActive }) => `
              relative group flex flex-col items-center justify-center flex-1
              h-12 rounded-[1rem]
              transition-all duration-200 ease-out
              active:scale-90
              ${isActive
                ? 'text-gold-text dark:text-gold-light font-bold'
                : 'text-[#1d1d1f] dark:text-gray-300 hover:text-black dark:hover:text-white'
              }
            `}
          >
            {({ isActive }) => {
              const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
              return (
                <>
                  {/* Icon */}
                  <Icon className={`
                    text-[22px] mb-0.5 z-10 transition-transform duration-300
                    ${isActive ? 'scale-110 filter drop-shadow-sm' : 'group-hover:scale-110'}
                  `} />

                  {/* Label */}
                  <span className="text-[10px] sm:text-xs font-medium tracking-tight z-10 transition-opacity duration-300 leading-none whitespace-nowrap">
                    {item.label}
                  </span>

                  {/* Active Indicator (Dot) */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-current rounded-full opacity-60" />
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
