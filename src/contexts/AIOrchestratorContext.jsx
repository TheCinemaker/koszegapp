import React, { createContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Assuming AuthContext handles user state - adjusting import based on standard conventions or previous files if visible. 
// If AuthContext doesn't exist, I will mock it or check file list first. 
// *Checking previous contexts or just proceeding carefully.*
// The user provided code uses: import { useAuth } from "./AuthContext";
// I will stick to that provided snippet.
import { useAuth } from "./AuthContext";

export const AIOrchestratorContext = createContext();

export function AIOrchestratorProvider({ children, appData, weather }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [suggestion, setSuggestion] = useState(null);
    const cooldownRef = useRef({});
    // eslint-disable-next-line no-unused-vars
    const sessionStartRef = useRef(Date.now());

    const COOLDOWN = 15 * 60 * 1000; // 15 minutes

    const isHome = location.pathname === "/";
    const now = new Date();
    const hour = now.getHours();

    const isOnCooldown = (key) => {
        return cooldownRef.current[key] && cooldownRef.current[key] > Date.now();
    };

    const setCooldown = (key) => {
        cooldownRef.current[key] = Date.now() + COOLDOWN;
    };

    useEffect(() => {
        if (!appData || appData.loading) return;

        evaluate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, appData, weather, user]);

    function evaluate() {
        if (!isHome) return;

        // 1️⃣ First session suggestion
        if (!user && !isOnCooldown("first_visit")) {
            setSuggestion({
                text: "Fedezd fel Kőszeg legszebb látnivalóit.",
                action: () => {
                    navigate("/attractions");
                    dismiss();
                }
            });
            setCooldown("first_visit");
            return;
        }

        // 2️⃣ Upcoming event within 30 minutes
        if (!isOnCooldown("event") && appData.events) {
            const upcoming = appData.events.find(e => {
                const eventDate = new Date(e.start_time || e.date); // Adjust property name as needed based on data structure
                return eventDate > now && (eventDate - now) < 30 * 60 * 1000;
            });

            if (upcoming) {
                setSuggestion({
                    text: `${upcoming.name} 30 percen belül kezdődik.`,
                    action: () => {
                        navigate(`/events/${upcoming.id}`);
                        dismiss();
                    }
                });
                setCooldown("event");
                return;
            }
        }

        // 3️⃣ Dinner intelligence
        if (!isOnCooldown("dinner") && hour >= 18 && hour <= 20) {
            setSuggestion({
                text: "Ideje vacsorázni. Megmutassam a legjobb helyeket?",
                action: () => {
                    navigate("/food"); // Changed from /gastronomy to /food based on known routes
                    dismiss();
                }
            });
            setCooldown("dinner");
            return;
        }

        // 4️⃣ Rain-based logic
        if (!isOnCooldown("rain") && weather?.icon?.includes("09")) {
            setSuggestion({
                text: "Esős idő. Mutatok beltéri programokat.",
                action: () => {
                    navigate("/attractions");
                    dismiss();
                }
            });
            setCooldown("rain");
            return;
        }
    }

    const dismiss = () => setSuggestion(null);

    return (
        <AIOrchestratorContext.Provider value={{ suggestion, dismiss }}>
            {children}
        </AIOrchestratorContext.Provider>
    );
}
