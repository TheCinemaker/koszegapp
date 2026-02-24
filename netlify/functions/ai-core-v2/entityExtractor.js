/**
 * entityExtractor.js – KőszegAI v2
 * Single concern: extract named entities from raw query.
 * Intent is NOT extracted here.
 */
export function extractEntities(query) {
    const entities = {};
    const normalized = query.replace(/[\s\-]/g, '');

    // License plate: 2-4 letters followed by 3 digits (HU format: ABC-123 or ABCD123)
    const plateMatch = normalized.match(/[a-zA-Z]{2,4}\d{3}/i);
    if (plateMatch) {
        entities.licensePlate = plateMatch[0].toUpperCase();
    }

    // Duration in hours: "2 óra", "3h"
    const durationMatch = query.match(/(\d+)\s*(óra|h\b)/i);
    if (durationMatch) {
        entities.duration = parseInt(durationMatch[1], 10);
    }

    // Mobility mode
    if (/gyalog|sétálva|gyalogosan/.test(query)) entities.mobility = 'walking';
    if (/\bautó\b|kocsival|autóval/.test(query)) entities.mobility = 'car';

    return entities;
}
