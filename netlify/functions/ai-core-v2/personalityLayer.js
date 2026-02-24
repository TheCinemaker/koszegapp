/**
 * personalityLayer.js – KőszegAI v2.1
 * Applies persona styling to pre-generated text.
 * ZERO business logic. Pure text transformation.
 */
export function applyPersonality(text, persona = 'friendly') {
    if (!text) return text;

    switch (persona) {
        case 'friendly':
            return text; // Personality comes from responseGenerator prompts
        case 'concise':
            return text.replace(/\s+!+/g, '.').replace(/😊|🚗|🏰|☕|🎫/g, '');
        default:
            return text;
    }
}
