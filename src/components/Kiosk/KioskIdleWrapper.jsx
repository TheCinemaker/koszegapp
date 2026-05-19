// src/components/Kiosk/KioskIdleWrapper.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KioskLangProvider } from '../../contexts/KioskLangContext';
import KioskShareQR from './KioskShareQR';
import './kiosk-contrast.css';

export default function KioskIdleWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const idleTimer = useRef(null);
  const needsReload = useRef(false);
  const pageLoadTime = useRef(Date.now());

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

  // Activity tracking effect
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

  // Automated 30-minute Standby Refresh Loop
  useEffect(() => {
    // 30 minutes in milliseconds = 1,800,000 ms
    const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

    const checkRefresh = () => {
      const elapsed = Date.now() - pageLoadTime.current;
      if (elapsed >= REFRESH_INTERVAL_MS) {
        const isHome = location.pathname === '/kiosk' || location.pathname === '/kiosk/';
        const isStandby = sessionStorage.getItem('kiosk-started') !== 'true';

        if (isHome && isStandby) {
          console.log("[Kiosk] Inactive for 30m, executing automatic F5 refresh...");
          window.location.reload();
        } else {
          console.log("[Kiosk] 30m elapsed but user is active. Deferring reload until standby...");
          needsReload.current = true;
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkRefresh, 30 * 1000);

    // Listen to idle trigger to reload immediately if deferred reload is pending
    const handleIdleTrigger = () => {
      if (needsReload.current) {
        console.log("[Kiosk] Standby activated, executing deferred F5 refresh...");
        window.location.reload();
      }
    };
    window.addEventListener('kiosk-idle-trigger', handleIdleTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener('kiosk-idle-trigger', handleIdleTrigger);
    };
  }, [location.pathname]);

  return (
    <KioskLangProvider>
      <div className="kiosk-idle-container w-full h-full min-h-screen relative">
        {children}
        <KioskShareQR />
      </div>
    </KioskLangProvider>
  );
}
