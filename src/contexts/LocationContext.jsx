import { createContext, useState } from "react";

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
    const [location, setLocation] = useState(null);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    timestamp: Date.now()
                });
                console.log("📍 Location acquired:", { lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                console.warn("Location error:", err);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <LocationContext.Provider value={{ location, requestLocation }}>
            {children}
        </LocationContext.Provider>
    );
}
