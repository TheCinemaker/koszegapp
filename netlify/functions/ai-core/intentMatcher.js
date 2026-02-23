export function detectIntent(query) {
    const q = query.toLowerCase();
    const detected = [];

    // 🚫 TILTOTT ZÓNÁK
    if (/koszeg1532|1532|jegyrendelés|ticket|játék|game|ételrendelés/.test(q)) return ['restricted'];

    // 1. Emergency & Services (High Priority)
    if (/segítség|orvos|patika|gyógyszertár|rendőr|mentő|tűzoltó|kórház|ügyelet/.test(q)) {
        detected.push('emergency');
    }

    // 2. Parking & Transport (Critical Business Logic)
    if (/\bparkol|parkoló|parkolhatok|parkolni|mélygarázs|automata|rendszám|jegy|sms|zóna|fizetés\b/.test(q)) {
        detected.push('parking');
    }
    // License Plate Detection (Stable: AAA-340, AAAM 340, AAA340)
    const normalizedPlate = q.replace(/[^a-z0-9]/gi, '');
    if (/^[a-z]{3,4}\d{3}$/i.test(normalizedPlate)) {
        detected.push('parking');
    }

    // 3. Food
    if (/étterem|ebéd|vacsora|gasztro|pizza|kávé|süti|cukrász|ennék|eszek|enni|beülni|reggeli|kocsma|borozó|fagy|gyors|éhes/.test(q)) {
        detected.push('food_general');
    }

    // 4. Attractions & Sights
    if (/\blátnivaló\b|\bműemlék\b|templom|\bvár\b|múzeum|szobor|kilátó|túra|séta|\bpark(?![oól])[a-zöüóőúéáí]*\b|tó|nézzek meg|látni|érdekessé|csinál/.test(q) || (/\bór(a|ám|át)?\b/.test(q) && /megnéz|csinál|ajánlj/.test(q))) {
        detected.push('attractions');
    }

    // 5. Events & Programs
    if (/program|esemény|koncert|fesztivál|kiállítás|buli|szórakozás|mozi|színház|mai|hétvégi/.test(q)) {
        detected.push('events');
    }

    // 6. Accomodation
    if (/szállás|hotel|panzió|kemping|apartman|szoba|vendégház|alvás/.test(q)) {
        detected.push('hotels');
    }

    // 7. Leisure & Sport
    if (/sport|túra|bicikli|kerékpár|játszótér|futás|edzés|szabadidő|séta/.test(q)) {
        detected.push('leisure');
    }

    // 8. Navigation & Location
    if (/hol van|hogy jutok|merre|térkép|útvonal|navigál|oda/.test(q)) {
        detected.push('navigation');
    }

    // 9. Itinerary & Planning
    if (/útiterv|terv|napra jövünk|napos program|mit csináljunk|ajánlj egy napot|órám van|ra jövök|délután mit/.test(q)) {
        detected.push('itinerary');
    }

    // 10. Greetings & Smalltalk
    if (/^szia|^heló|^hali|^jó napot|^üdv|^hogy vagy|^mizu|^köszönöm/.test(q) && detected.length === 0) {
        return ['smalltalk'];
    }

    // Final sorting and fallback
    if (detected.length === 0) return ['unknown'];

    const PRIORITY = {
        emergency: 200,
        parking: 100,
        itinerary: 70,
        food_general: 60,
        attractions: 50,
        events: 40,
        hotels: 30,
        leisure: 20,
        navigation: 10,
        smalltalk: 1,
        unknown: 0
    };

    detected.sort((a, b) => PRIORITY[b] - PRIORITY[a]);
    return [...new Set(detected)]; // Return unique, sorted intents
}
