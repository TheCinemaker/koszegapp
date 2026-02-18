import React, { createContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getSmartTrigger } from "../ai/SmartTriggerEngine";

export const AIOrchestratorContext = createContext();

export function AIOrchestratorProvider({ children, appData, weather }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth(); // Assuming AuthContext is correct

    const [suggestion, setSuggestion] = useState(null);
    const [userLocation, setUserLocation] = useState(null); // { lat, lng, distanceToMainSquare }

    // Tracking user behavior with persistence
    const [userBehavior, setUserBehavior] = useState(() => {
        try {
            const saved = localStorage.getItem('ai_user_behavior');
            return saved ? JSON.parse(saved) : {
                ignoredDinner: false,
                ignoredLunch: false,
                ignoredRain: false,
                ignoredPlanning: false,
                ignoredParking: false,
                ignoredHotels: false,
                ignoredEvents: false,
                lastShown: null
            };
        } catch (e) {
            console.warn("Error reading behavior from storage", e);
            return { lastShown: null };
        }
    });

    useEffect(() => {
        localStorage.setItem('ai_user_behavior', JSON.stringify(userBehavior));
    }, [userBehavior]);

    const MAIN_SQUARE = { lat: 47.3883538, lng: 16.5421414 }; // Fő tér coords

    // Calculate distance in meters
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d * 1000; // Meters
    }

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180)
    }

    // 1. Get Location (One-off or Watch)
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const dist = getDistanceFromLatLonInKm(latitude, longitude, MAIN_SQUARE.lat, MAIN_SQUARE.lng);

                console.log("📍 User Location:", { latitude, longitude, dist });
                setUserLocation({ lat: latitude, lng: longitude, distanceToMainSquare: dist });
            }, (error) => {
                console.warn("Location access denied or error:", error);
            });
        }
    }, [location.pathname]); // Re-check on nav change (simulate dynamic check)

    // 2. Evaluate Smart Triggers
    useEffect(() => {
        if (!appData || appData.loading) return;

        // Run the engine
        const trigger = getSmartTrigger({
            location: userLocation,
            hour: new Date().getHours(),
            weather: weather, // Function should handle if weather is null
            events: appData.events || [],
            lastShown: userBehavior.lastShown,
            userBehavior: userBehavior
        });

        if (trigger) {
            console.log("💡 Smart Trigger:", trigger);
            setSuggestion(trigger);
        } else {
            setSuggestion(null);
        }

    }, [userLocation, appData, weather, userBehavior]);

    // Actions
    const dismiss = () => {
        if (suggestion) {
            // Update behavior based on type
            if (suggestion.type === 'food') {
                const hour = new Date().getHours();
                if (hour >= 18) setUserBehavior(prev => ({ ...prev, ignoredDinner: true }));
                if (hour >= 12 && hour <= 14) setUserBehavior(prev => ({ ...prev, ignoredLunch: true }));
            }
            if (suggestion.type === 'rain') setUserBehavior(prev => ({ ...prev, ignoredRain: true }));

            setUserBehavior(prev => ({ ...prev, lastShown: Date.now() }));
        }
        setSuggestion(null);
    };

    const acceptSuggestion = () => {
        // Logic handled by UI consuming the context (e.g. opening chat)
        // But we should record that we showed it
        setUserBehavior(prev => ({ ...prev, lastShown: Date.now() }));
        setSuggestion(null); // Clear active suggestion
        return suggestion;
    };

    return (
        <AIOrchestratorContext.Provider value={{ suggestion, dismiss, acceptSuggestion, userLocation }}>
            {children}
        </AIOrchestratorContext.Provider>
    );
}
