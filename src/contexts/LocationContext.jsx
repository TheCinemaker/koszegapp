import { createContext, useState, useEffect, useRef } from "react";

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const watchId = useRef(null);
    const watchCount = useRef(0);

    const startWatching = () => {
        if (!navigator.geolocation) {
            setLocationError('unsupported');
            return;
        }

        watchCount.current += 1;
        if (watchId.current) return;

        // 1. AZONNALI FIX (Gyors, akár gyorstárazott és kisebb pontosságú is jó elsőre)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocationError(null);
                if (!location) { // Csak ha még nincs meg a helyzet
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: Date.now(),
                        isQuickFix: true
                    });
                }
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) setLocationError('denied');
            },
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );

        // 2. FOLYAMATOS PONTOS KÖVETÉS (Ez lassabb, de háttérben fut)
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setLocationError(null);
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: Date.now(),
                    isQuickFix: false
                });
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) setLocationError('denied');
                else if (!location) setLocationError('unavailable');
                console.warn("Location watch error:", err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const stopWatching = () => {
        watchCount.current = Math.max(0, watchCount.current - 1);
        if (watchCount.current === 0 && watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('unsupported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocationError(null);
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    timestamp: Date.now()
                });
            },
            (err) => {
                setLocationError(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
                console.warn(err);
            },
            { enableHighAccuracy: true }
        );
    };

    // Auto-stop on unmount
    useEffect(() => {
        return () => stopWatching();
    }, []);

    return (
        <LocationContext.Provider value={{ location, locationError, requestLocation, startWatching, stopWatching }}>
            {children}
        </LocationContext.Provider>
    );
}
