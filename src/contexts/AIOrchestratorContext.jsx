import React, { createContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getSmartTrigger } from "../ai/SmartTriggerEngine";
import { getBehaviorProfile, registerUserIgnore, getUserProfile, initBehaviorEngine, updateInterest } from "../ai/BehaviorEngine";
import { getUserContext, updateLocation } from "../core/UserContextEngine";

export const AIOrchestratorContext = createContext();

export function AIOrchestratorProvider({ children, appData, weather }) {
    const { user } = useAuth();

    const [suggestion, setSuggestion] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [userBehavior, setUserBehavior] = useState(getBehaviorProfile());
    const [lastDecision, setLastDecision] = useState(null);

    const triggerCooldownRef = useRef(false);

    const MAIN_SQUARE = { lat: 47.3883538, lng: 16.5421414 };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000;
    };

    // 0️⃣ INIT BEHAVIOR on User Load (Supabase Sync)
    useEffect(() => {
        if (user?.id) {
            initBehaviorEngine(user.id);
        }
    }, [user?.id]);

    // ==========================================
    // 1️⃣ LIVE LOCATION TRACKING (Apple-style)
    // ==========================================
    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;

                const dist = getDistance(
                    latitude,
                    longitude,
                    MAIN_SQUARE.lat,
                    MAIN_SQUARE.lng
                );

                const locationPayload = {
                    lat: latitude,
                    lng: longitude,
                    distanceToMainSquare: dist,
                    speed: speed || 0
                };

                setUserLocation(locationPayload);

                updateLocation({
                    latitude,
                    longitude,
                    speed: speed || 0
                });

                // console.log("📍 LIVE:", locationPayload);
            },
            (err) => console.warn("Location error:", err),
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 15000
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // ==========================================
    // 2️⃣ SMART TRIGGER EVALUATION
    // ==========================================
    useEffect(() => {
        if (!appData || appData.loading) return;
        if (!userLocation) return;

        if (triggerCooldownRef.current) return;

        const ctx = getUserContext();

        const trigger = getSmartTrigger({
            location: userLocation,
            velocity: { speed: ctx.speed, movement: ctx.movement },
            hour: new Date().getHours(),
            weather,
            events: appData.events || [],
            lastShown: parseInt(localStorage.getItem("ai_last_shown") || 0),
            userBehavior,
            userProfile: getUserProfile()
        });

        if (!trigger) return;

        console.log("💡 Trigger:", trigger);

        setSuggestion(trigger);
        setLastDecision({
            trigger,
            timestamp: Date.now()
        });

        triggerCooldownRef.current = true;

        setTimeout(() => {
            triggerCooldownRef.current = false;
        }, 60000); // 1 perc lokális cooldown (hogy ne villogjon)

    }, [
        userLocation,
        weather,
        userBehavior,
        appData?.events?.length
    ]);

    // ==========================================
    // 3️⃣ ACTIONS
    // ==========================================
    const dismiss = () => {
        if (!suggestion) return;

        registerUserIgnore(suggestion.type, user?.id); // Pass UserId for Cloud Sync
        setUserBehavior(getBehaviorProfile());

        localStorage.setItem("ai_last_shown", Date.now());

        setSuggestion(null);
    };

    const acceptSuggestion = () => {
        if (!suggestion) return null;

        localStorage.setItem("ai_last_shown", Date.now());

        // Positive Reinforcement (Deep Memory)
        if (suggestion.category && user?.id) {
            updateInterest(suggestion.category, 0.1, user.id);
        }

        const current = suggestion;
        setSuggestion(null);
        return current;
    };

    return (
        <AIOrchestratorContext.Provider
            value={{
                suggestion,
                dismiss,
                acceptSuggestion,
                userLocation,
                lastDecision,
                setLastDecision // EXPOSED FOR AIAssistant.jsx
            }}
        >
            {children}
        </AIOrchestratorContext.Provider>
    );
}
