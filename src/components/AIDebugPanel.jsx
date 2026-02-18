import React, { useState, useEffect, useContext } from "react";
import { getUserContext } from "../core/UserContextEngine";
import { AIOrchestratorContext } from "../contexts/AIOrchestratorContext";

export default function AIDebugPanel() {
    const { lastDecision } = useContext(AIOrchestratorContext);
    const [ctx, setCtx] = useState(getUserContext());

    // Poll for context updates (since UserContext is not reactive)
    useEffect(() => {
        const interval = setInterval(() => {
            setCtx({ ...getUserContext() });
        }, 500); // 2Hz refresh

        return () => clearInterval(interval);
    }, []);

    if (!ctx) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            color: "#00ff00",
            fontFamily: "monospace",
            fontSize: 10,
            padding: "10px",
            zIndex: 100000,
            maxHeight: "35vh",
            overflowY: "auto",
            borderTop: "1px solid #00ff00",
            pointerEvents: "none" // Allow clicks to pass through generally, but maybe we want to scroll?
            // pointerEvents: "auto" is safer for scrolling
        }} className="pointer-events-auto">
            <h4 style={{ margin: "0 0 5px 0", color: "#fff", fontWeight: "bold" }}>🧠 AI SYSTEM DEBUG</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                    <strong>📍 USER CONTEXT</strong>
                    <pre style={{ margin: 0 }}>
                        {JSON.stringify({
                            loc: ctx.location ? `${ctx.location.latitude.toFixed(4)}, ${ctx.location.longitude.toFixed(4)}` : 'N/A',
                            speed: `${(ctx.speed || 0).toFixed(1)} km/h`,
                            move: ctx.movement || '?',
                            mode: ctx.appMode,
                            page: ctx.lastPage,
                            time: `${(ctx.timeOnPage / 1000).toFixed(1)}s`
                        }, null, 2)}
                    </pre>
                </div>
                <div>
                    <strong>🤖 LAST DECISION</strong>
                    <pre style={{ margin: 0, color: lastDecision ? "#00ffff" : "gray" }}>
                        {lastDecision ? JSON.stringify(lastDecision, null, 2) : "Calculating..."}
                    </pre>
                </div>
            </div>
        </div>
    );
}
