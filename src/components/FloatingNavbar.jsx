import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  IoHomeOutline, IoHome,
  IoLocationOutline, IoLocation,
  IoCalendarOutline, IoCalendar,
  IoRestaurantOutline, IoRestaurant,
  IoBedOutline, IoBed,
  IoBicycleOutline, IoBicycle,
  IoCarOutline, IoCar,
  IoMapOutline, IoMap,
  IoCloudyNightOutline, IoCloudyNight,
  IoInformationCircleOutline, IoInformationCircle,
  IoPersonCircleOutline, IoPersonCircle,
  IoKeyOutline, IoKey
} from 'react-icons/io5';

export default function FloatingNavbar() {
  const navItems = [
    { to: "/", icon: IoHomeOutline, activeIcon: IoHome, label: "Főoldal" },
    { to: "/attractions", icon: IoLocationOutline, activeIcon: IoLocation, label: "Látnivalók" },
    { to: "/events", icon: IoCalendarOutline, activeIcon: IoCalendar, label: "Események" },
    { to: "/gastronomy", icon: IoRestaurantOutline, activeIcon: IoRestaurant, label: "Gasztró" },
    { to: "/hotels", icon: IoBedOutline, activeIcon: IoBed, label: "Szállás" },
    { to: "/leisure", icon: IoBicycleOutline, activeIcon: IoBicycle, label: "Szabadidő" },
    { to: "/parking", icon: IoCarOutline, activeIcon: IoCar, label: "Parkolás" },
    { to: "/live-map", icon: IoMapOutline, activeIcon: IoMap, label: "Térkép" },
    { to: "/weather", icon: IoCloudyNightOutline, activeIcon: IoCloudyNight, label: "Időjárás" },
    { to: "/info", icon: IoInformationCircleOutline, activeIcon: IoInformationCircle, label: "Infó" },
  ];

  const { user } = useAuth();

  // Dynamic Auth Item
  const authItem = user
    ? { to: "/pass/profile", icon: IoPersonCircleOutline, activeIcon: IoPersonCircle, label: "Profil" }
    : { to: "/pass/register", icon: IoKeyOutline, activeIcon: IoKey, label: "Belépés" };

  // Add to nav items
  const allNavItems = [...navItems, authItem];

  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-[95vw] sm:max-w-md pointer-events-none">
      <div className="
        pointer-events-auto
        flex items-center gap-1
        px-2 py-1.5
        bg-white/40 dark:bg-[#1a1c2e]/40 
        backdrop-blur-[25px] 
        backdrop-saturate-[1.8]
        backdrop-brightness-[1.1]
        rounded-[30px] 
        border border-white/50 dark:border-white/20 
        shadow-[0_10px_40px_rgba(0,0,0,0.1)] 
        transition-all duration-300
        overflow-x-auto scrollbar-hide snap-x snap-mandatory
      ">
        {allNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              relative group flex flex-col items-center justify-center
              min-w-[4rem] h-10 rounded-[1rem] snap-center
              transition-all duration-200 ease-out
              active:scale-90
              ${isActive
                ? 'text-[#007AFF] dark:text-[#0A84FF]'
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
                  <span className="text-[9px] font-medium tracking-tight z-10 transition-opacity duration-300 leading-none whitespace-nowrap">
                    {item.label}
                  </span>

                  {/* Active Indicator (Dot) */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-current rounded-full opacity-60" />
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
