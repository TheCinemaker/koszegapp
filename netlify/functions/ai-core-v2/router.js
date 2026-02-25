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

    // ── Parking INFO (kérdés, nem parancs) ────────────────────────────
    if (intents.includes('parking_info')) {
        // Ha már folyamatban van valami, elsőként azt kezeljük
        if (state.phase !== 'idle') {
            return { newState: state, replyType: 'continue_current_flow', action: null };
        }

        const someoneInCity = context.situation?.anyoneInCity || false;
        const wifeInCity = context.situation?.wifeInCity || false;
        const userInCity = context.situation?.status === 'in_city';

        if (!someoneInCity) {
            return {
                newState: { ...state, phase: 'arrival_planning' },
                replyType: 'parking_info_not_in_city',
                action: null
            };
        }
        if (wifeInCity) {
            return {
                newState: { ...state, phase: 'parking_offer_wife' },
                replyType: 'parking_info_wife_there',
                action: null
            };
        }
        if (userInCity) {
            return {
                newState: { ...state, phase: 'parking_offer_user' },
                replyType: 'parking_info_user_there',
                action: null
            };
        }
        return { newState: state, replyType: 'parking_info', action: null };
    }

    // ── Parking offer ────────────────────────────────────────
    if (state.phase === 'parking_offer_wife' || state.phase === 'parking_offer_user') {
        if (/igen|persze|oké|rendben|indítsd|szeretném/i.test(query)) {
            if (entities.licensePlate) {
                return {
                    newState: { ...state, phase: 'parking_collect_duration', tempData: { licensePlate: entities.licensePlate } },
                    replyType: 'ask_duration', action: null
                };
            }
            return { newState: { ...state, phase: 'parking_collect_plate' }, replyType: 'ask_plate', action: null };
        }
        if (/nem|mégse|kösz|nem kell/i.test(query)) {
            return { newState: { phase: 'idle', tempData: {} }, replyType: 'parking_offer_declined', action: null };
        }
    }

    // ── Mid-flow: user abandons parking/arrival, switches topic ──────────
    const isInFlow = state.phase?.startsWith('parking_') || state.phase === 'arrival_planning';
    const wantsOtherNow = !intents.includes('parking') && intents.some(i =>
        ['food', 'attractions', 'navigation', 'events', 'hotels'].includes(i)
    );
    if (isInFlow && wantsOtherNow) {
        return routeNonParking({ intents, entities, state: { phase: 'idle', tempData: {}, mobility: context.mobility }, context, query });
    }

    // ── PARKING FLOW (deterministic state machine) ───────────────────────
    const inCity = context.situation?.status === 'in_city' || context.situation?.status == null;

    // Parking intent → only start flow if user is IN the city
    if (intents.includes('parking') && state.phase === 'idle') {
        if (!inCity) {
            return {
                newState: state,
                replyType: 'parking_not_in_city',
                action: null
            };
        }
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

    // Direct plate at idle (only if in city)
    if (state.phase === 'idle' && entities.licensePlate && !intents.includes('parking') && inCity) {
        return {
            newState: { ...state, phase: 'parking_collect_duration', tempData: { licensePlate: entities.licensePlate } },
            replyType: 'ask_duration',
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
        // User said something unclear – re-prompt (don't fall through!)
        return { newState: state, replyType: 'confirm_parking', action: null };
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
        // User said something unclear – re-prompt consent
        return { newState: state, replyType: 'ask_save_consent', action: null };
    }

    // ── Non-parking intents ──────────────────────────────────────────────
    return routeNonParking({ intents, entities, state, context, query });
}

function routeNonParking({ intents, state, context, query }) {
    const q = query.toLowerCase();
    const entities = context.entities || {};
    const notInCity = context.situation?.status === 'not_in_city';

    // ── 1. ARRIVAL PLANNING (Ha nem vagy itt, de látni akarsz valamit) ──
    const needsInCityData = intents.some(i => ['food', 'attractions', 'events', 'hotels', 'tours', 'shopping', 'practical'].includes(i));

    // Ha nem vagy itt, és még nem tudjuk mikor jössz, ÉS még nem is kérdeztük meg ebben a sessionben
    if (notInCity && needsInCityData && !state.tempData?.arrivalTime && !state.tempData?.arrivalAsked) {
        // CSAK akkor szakítsuk meg a folyamatot, ha nincs konkrétabb kérdés (pl. csak beköszönt vagy általánosságban érdeklődik)
        const specificIntents = intents.filter(i => !['smalltalk', 'unknown', 'greeting'].includes(i));
        const isStrictService = intents.includes('parking') || intents.includes('build_itinerary');

        if (specificIntents.length === 0 || isStrictService) {
            return {
                newState: {
                    ...state,
                    phase: 'arrival_planning',
                    tempData: { ...state.tempData, arrivalAsked: true }
                },
                replyType: 'ask_arrival_time',
                action: null
            };
        }

        // Ha van konkrét kérdés (pl. pizza), akkor csak jegyezzük fel a fázist, de engedjük át a kérést!
        state.phase = 'arrival_planning';
        state.tempData = { ...state.tempData, arrivalAsked: true };
    }

    // Felhasználó válaszol az érkezési időre (csak ha tényleg időt mond!)
    const isTimeResponse = /(ma|holnap|hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap|óra|dél|perc|körül|ekkor)/i.test(q) || entities.time;

    if (state.phase === 'arrival_planning' && isTimeResponse && !state.tempData?.arrivalTime) {
        return {
            newState: {
                ...state,
                phase: 'arrival_planning',
                tempData: { ...state.tempData, arrivalTime: q, arrivalProcessed: false }
            },
            replyType: 'arrival_time_received',
            action: null
        };
    }

    // Ha arrival_planning-ben vagyunk, de NEM időt mondott, hanem valami mást kért (pl. sütit)
    // Akkor lépjünk ki a fázisból és válaszoljunk a kérésre!
    if (state.phase === 'arrival_planning' && !isTimeResponse && needsInCityData) {
        state.phase = 'idle';
        // Folytatjuk a többi ággal...
    }

    // Érkezési idő utáni első "igazi" kérés nyugtázása
    if (state.tempData?.arrivalTime && !state.tempData.arrivalProcessed) {
        return {
            newState: {
                ...state,
                phase: 'idle',
                tempData: { ...state.tempData, arrivalProcessed: true }
            },
            replyType: 'arrival_time_acknowledged',
            action: null
        };
    }

    // ── 2. SPECIÁLIS ÁGAK (Időjárás, Család, stb.) ─────────────────────

    // Időjárás alapú (eső) – EZ MINDENT FELÜLÍR az érintett intenteknél
    if (context.weather?.isRain && intents.some(i => ['food', 'attractions', 'tours'].includes(i))) {
        return { newState: state, replyType: 'rainy_day_recommendations', action: null };
    }

    // Családbarát – EZ ELŐBB VAN, mint a sima attractions
    if (entities.withKids && (intents.includes('attractions') || intents.includes('families'))) {
        return { newState: state, replyType: 'families', action: null };
    }

    // ── 3. ÚJ INTENTEK KEZELÉSE ───────────────────────────────────────

    if (intents.includes('tours')) {
        return { newState: state, replyType: 'tours', action: null };
    }

    if (intents.includes('shopping')) {
        return { newState: state, replyType: 'shopping', action: null };
    }

    if (intents.includes('practical')) {
        return { newState: state, replyType: 'practical', action: null };
    }

    if (intents.includes('families')) {
        return { newState: state, replyType: 'families', action: null };
    }

    if (intents.includes('accessibility')) {
        return { newState: state, replyType: 'accessibility', action: null };
    }

    // ── 4. ALAP INTENTEK ──────────────────────────────────────────────

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

    // Ha semmi sem talált, akkor a megszokott normal (LLM fallback)
    return { newState: state, replyType: 'normal', action: null };
}
