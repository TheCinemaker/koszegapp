/**
 * tools/navigationTool.js – KőszegAI v2.1
 * Builds deterministic navigation action for the frontend.
 * No LLM involvement.
 */
export function buildNavigationAction(destination) {
    if (!destination?.coordinates) return null;

    return {
        type: 'open_navigation',
        params: {
            lat: destination.coordinates.lat,
            lng: destination.coordinates.lng,
            label: destination.name
        }
    };
}
