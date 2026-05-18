// src/components/Kiosk/KioskIdleWrapper.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function KioskIdleWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const idleTimer = useRef(null);

  // Determine timeout duration based on path (e.g. 180s for selfie camera posing, 90s for others)
  const isSelfiePage = location.pathname.includes('/selfie');
  const timeoutMs = isSelfiePage ? 180000 : 90000; 

  const resetTimer = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    idleTimer.current = setTimeout(() => {
      // Trigger Screensaver state
      window.dispatchEvent(new CustomEvent('kiosk-idle-trigger'));

      // If not already on home, navigate back to home
      if (location.pathname !== '/kiosk' && location.pathname !== '/kiosk/') {
        navigate('/kiosk');
      }
    }, timeoutMs);
  };

  useEffect(() => {
    // Events that represent user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Initialize timer
    resetTimer();

    // Attach listeners
    const handleActivity = () => resetTimer();
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      // Clean up
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [location.pathname, timeoutMs]); // Reset or change timeout when page changes

  return <div className="kiosk-idle-container w-full h-full min-h-screen relative">{children}</div>;
}
