/**
 * router.js – ai-core-v2 (v5 multi-intent state machine)
 *
 * Takes an ARRAY of intents (priority-sorted by intentResolver).
 * Pure function - zero side effects.
 *
 * STATES:
 *   idle
 *   parking_collect_plate
 *   parking_collect_duration
 *   parking_confirm
 *   parking_save_consent
 */
export function routeConversation({ intents, entities, state, context, query }) {

    // ── Emergency always wins ────────────────────────────────────────────
    if (intents.includes('emergency')) {
        return {
            newState: { ...state, phase: 'idle' },
            replyType: 'emergency',
            action: { type: 'call_emergency', params: {} }
        };
    }

    // ── Mid-flow: user abandons parking, switches topic ──────────────────
    const isInParkingFlow = state.phase?.startsWith('parking_');
    const wantsOtherNow = !intents.includes('parking') && intents.some(i =>
        ['food', 'attractions', 'navigation', 'events', 'hotels'].includes(i)
    );
    if (isInParkingFlow && wantsOtherNow) {
        // Let it fall through to normal handling with reset
        return routeNonParking({ intents, entities, state: { phase: 'idle', tempData: {}, mobility: context.mobility }, context, query });
    }

    // ── PARKING FLOW (deterministic state machine) ───────────────────────

    // Parking intent with plate already in message → skip to duration
    if (intents.includes('parking') && state.phase === 'idle') {
        if (entities.licensePlate) {
            return {
                newState: { ...state, phase: 'parking_collect_duration', tempData: { licensePlate: entities.licensePlate } },
                replyType: 'ask_duration',
                action: null
            };
        }
        return {
            newState: { ...state, phase: 'parking_collect_plate' },
            replyType: 'ask_plate',
            action: null
        };
    }

    if (state.phase === 'parking_collect_plate' && entities.licensePlate) {
        return {
            newState: { ...state, phase: 'parking_collect_duration', tempData: { licensePlate: entities.licensePlate } },
            replyType: 'ask_duration',
            action: null
        };
    }

    if (state.phase === 'parking_collect_duration' && entities.duration) {
        return {
            newState: { ...state, phase: 'parking_confirm', tempData: { ...state.tempData, duration: entities.duration } },
            replyType: 'confirm_parking',
            action: null
        };
    }

    if (state.phase === 'parking_confirm') {
        if (/igen|mehet|rendben|ok\b|persze/i.test(query)) {
            return {
                newState: { ...state, phase: 'parking_save_consent' },
                replyType: 'ask_save_consent',
                action: null
            };
        }
        if (/nem|mégse|vissza|töröl/i.test(query)) {
            return {
                newState: { phase: 'idle', tempData: {}, mobility: context.mobility },
                replyType: 'parking_cancelled',
                action: null
            };
        }
    }

    if (state.phase === 'parking_save_consent') {
        if (/igen|mentsd|persze|ok\b/i.test(query)) {
            return {
                newState: { phase: 'idle', tempData: {}, mobility: context.mobility },
                replyType: 'parking_success',
                action: { type: 'save_and_start_parking', params: state.tempData }
            };
        }
        if (/nem|kihagyom|nem kell/i.test(query)) {
            return {
                newState: { phase: 'idle', tempData: {}, mobility: context.mobility },
                replyType: 'parking_success',
                action: { type: 'start_parking_only', params: state.tempData }
            };
        }
    }

    // ── Non-parking intents ──────────────────────────────────────────────
    return routeNonParking({ intents, entities, state, context, query });
}

function routeNonParking({ intents, state, context, query }) {

    // Multi-intent: food + attractions → build itinerary
    if (intents.includes('food') && intents.includes('attractions')) {
        return { newState: state, replyType: 'build_itinerary', action: null };
    }

    if (intents.includes('food')) {
        return { newState: state, replyType: 'food_search', action: null };
    }

    if (intents.includes('attractions')) {
        return { newState: state, replyType: 'attractions', action: null };
    }

    if (intents.includes('events')) {
        return { newState: state, replyType: 'events', action: null };
    }

    if (intents.includes('hotels')) {
        return { newState: state, replyType: 'hotels', action: null };
    }

    if (intents.includes('navigation')) {
        return {
            newState: state,
            replyType: context.location ? 'offer_navigation' : 'ask_destination',
            action: null
        };
    }

    if (intents.includes('smalltalk')) {
        return { newState: { ...state, phase: 'idle' }, replyType: 'greeting', action: null };
    }

    return { newState: state, replyType: 'normal', action: null };
}
