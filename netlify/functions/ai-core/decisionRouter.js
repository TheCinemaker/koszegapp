export function decideFoodAction({
    query,
    appMode,
    hour
}) {
    const q = query.toLowerCase();

    let placeScore = 0;
    let deliveryScore = 0;

    // 1. Linguistic signals
    // Delivery keywords
    if (/rendel|házhoz|kiszállítás|futár|otthon/.test(q)) deliveryScore += 10;
    // Place keywords
    if (/enni|beülni|étterem|pizzéria|helyben|asztal/.test(q)) placeScore += 10;

    // 2. Situational signals
    // City Mode -> Likely wants to eat out (unless explicitly asking for delivery)
    if (appMode === 'city') placeScore += 5;

    // Remote Mode -> Likely wants to browse or order (unless explicitly asking to reserve)
    if (appMode === 'remote') deliveryScore += 5;

    // Time signals
    // Lunch/Dinner time (when out) -> Place
    if (hour >= 11 && hour <= 14) placeScore += 3;
    if (hour >= 18 && hour <= 20) placeScore += 3;

    // Late night -> Delivery (less places open, more likely home)
    if (hour >= 21) deliveryScore += 5;

    console.log(`⚖️ Decision Router: Place ${placeScore} vs Delivery ${deliveryScore}`);

    // Linguistic override: if user explicitly says "rendelni", deliveryScore is high (10+). 
    // If they say "étterem", placeScore is high.
    // Situational adds nuance.

    if (placeScore >= deliveryScore) {
        return {
            action: { type: "navigate_to_restaurants", params: { filter: "food" } }, // Generic filter or extracted from query
            intent: "food_place"
        };
    } else {
        return {
            action: { type: "navigate_to_food", params: { search: "food" } },
            intent: "food_delivery"
        };
    }
}
