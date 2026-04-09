import { createContext, useState, useEffect, useRef } from "react";

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
    const [location, setLocation] = useState(null);
    const watchId = useRef(null);

    const startWatching = () => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported by this browser.");
            return;
        }

        if (watchId.current) return;

        // 1. AZONNALI FIX (Gyors, akár gyorstárazott és kisebb pontosságú is jó elsőre)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
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
            (err) => console.warn("Quick fix failed:", err),
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );

        // 2. FOLYAMATOS PONTOS KÖVETÉS (Ez lassabb, de háttérben fut)
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: Date.now(),
                    isQuickFix: false
                });
                console.log("📍 High-accuracy location updated");
            },
            (err) => {
                console.warn("Location watch error:", err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const stopWatching = () => {
        if (watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    timestamp: Date.now()
                });
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true }
        );
    };

    // Auto-stop on unmount
    useEffect(() => {
        return () => stopWatching();
    }, []);

    return (
        <LocationContext.Provider value={{ location, requestLocation, startWatching, stopWatching }}>
            {children}
        </LocationContext.Provider>
    );
}
