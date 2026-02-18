export function getFallbackResponse(query) {
    return {
        text: "Sajnálom, technikai hiba történt. Azonban itt vannak a legfontosabb események és információk.",
        action: {
            type: "navigate_to_events",
            params: {}
        },
        confidence: 0.5,
        debug: "Fallback triggered"
    };
}
