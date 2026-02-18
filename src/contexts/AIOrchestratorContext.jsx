import React, { createContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getSmartTrigger } from "../ai/SmartTriggerEngine";
import { getBehaviorProfile, registerUserIgnore, getUserProfile } from "../ai/BehaviorEngine";

export const AIOrchestratorContext = createContext();

export function AIOrchestratorProvider({ children, appData, weather }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [suggestion, setSuggestion] = useState(null);
    const [userLocation, setUserLocation] = useState(null); // { lat, lng, distanceToMainSquare }

    // Tracking user behavior (fetched from BehaviorEngine)
    const [userBehavior, setUserBehavior] = useState(getBehaviorProfile());

    const MAIN_SQUARE = { lat: 47.3883538, lng: 16.5421414 }; // Fő tér coords

    // Helpers
    const deg2rad = (deg) => deg * (Math.PI / 180);

    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d * 1000; // Meters
    };

    // 1. Get Location
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
    }, [location.pathname]);

    // 2. Evaluate Smart Triggers
    useEffect(() => {
        if (!appData || appData.loading) return;

        // Run the engine
        const trigger = getSmartTrigger({
            location: userLocation,
            hour: new Date().getHours(),
            weather: weather,
            events: appData.events || [],
            lastShown: parseInt(localStorage.getItem('ai_last_shown') || 0),
            userBehavior: userBehavior,
            userProfile: getUserProfile()
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
            registerUserIgnore(suggestion.type);
            setUserBehavior(getBehaviorProfile()); // Update state to reflect new penalty

            const now = Date.now();
            localStorage.setItem('ai_last_shown', now);
        }
        setSuggestion(null);
    };

    const acceptSuggestion = () => {
        const now = Date.now();
        localStorage.setItem('ai_last_shown', now);

        // Return suggestion logic to UI
        const currentSuggestion = suggestion;
        setSuggestion(null);
        return currentSuggestion;
    };

    // Debugging / Logging
    const [lastDecision, setLastDecision] = useState(null);

    return (
        <AIOrchestratorContext.Provider value={{ suggestion, dismiss, acceptSuggestion, userLocation, lastDecision, setLastDecision }}>
            {children}
        </AIOrchestratorContext.Provider>
    );
}
