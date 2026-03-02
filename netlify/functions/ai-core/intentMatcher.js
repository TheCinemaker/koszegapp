export function detectIntent(query) {
    const q = query.toLowerCase();
    const detected = [];

    // 🚫 TILTOTT ZÓNÁK
    if (/koszeg1532|1532|jegyrendelés|ticket|játék|game|ételrendelés|food order/.test(q)) return ['restricted'];

    // 1. Emergency & Services (High Priority)
    if (/segítség|orvos|patika|gyógyszertár|rendőr|mentő|tűzoltó|kórház|ügyelet|rosszul vagyok|baleset/.test(q)) {
        detected.push('emergency');
    }

    // 2. Parking & Transport (Critical Business Logic)
    // Catch broad parking-related phrases in natural Hungarian
    if (/\bparkol[a-záéíóöőúüű]*\b|\bparkoló\b|mélygarázs|parkolhatok|parkolóhely|rendszám|parkolójegy|parkolási|sms.?parkolás|fizetős övezet|zóna|jegyet (kell|vennem|veszek)/.test(q)) {
        detected.push('parking');
    }
    // License plate pattern: ABC-123, ABCD 123, ABC123
    const normalizedPlate = q.replace(/\s|-/g, '');
    if (/^[a-záéíóöőúüű]{2,4}\d{3}$/i.test(normalizedPlate) || /\b[a-z]{2,4}[\s-]?\d{3}\b/i.test(q)) {
        if (!detected.includes('parking')) detected.push('parking');
    }

    // 3. Food / Restaurants / Cafes
    if (/étterem|éttere[mt]|ebéd|vacsora|gasztro|pizza|kávé|süti|cukrász|ennék|eszek|enni|beülni|reggeli|kocsma|borozó|fagylalt|gyorsétel|éhes|burgerhez|kávézó|kávéhoz|ahol innám|étkezés/.test(q)) {
        detected.push('food_general');
    }

    // 4. Attractions & Sightseeing
    if (/látnivaló|műemlék|templom|vár|múzeum|szobor|kilátó|séta|nézzek meg|látni|érdekesség|mit néz|csinál|merre menjek|hol sétál|várnegyede?|belváros/.test(q)
        || (/\bór(a|ám|át)?(\s+van)?\b/.test(q) && /megnéz|csinál|ajánlj|nézzek/.test(q))) {
        detected.push('attractions');
    }

    // 5. Walking / Leisure (séta külön is)
    if (/séta|sétál|korzó|túra|bicikli|kerékpár|játszótér|futás|edzés|sport|szabadidő|park\b/.test(q)) {
        detected.push('leisure');
    }

    // 6. Events & Programs
    if (/program|esemény|koncert|fesztivál|kiállítás|buli|szórakozás|mozi|színház|ma este|hétvégén|mai nap|aktuális/.test(q)) {
        detected.push('events');
    }

    // 7. Accommodation & Booking
    if (/szállás|hotel|panzió|kemping|apartman|szoba|vendégház|aludni|ahol alszom|foglalni|foglalás/.test(q)) {
        detected.push('booking');
    }
    if (detected.includes('booking') && !detected.includes('hotels')) detected.push('hotels');

    // 8. Tickets & Purchases
    if (/jegy|belépő|ticket|vásárlás|venni|fizetni|vásárolni|jegyvásárlás/.test(q) && !detected.includes('parking')) {
        detected.push('tickets');
    }

    // 9. Navigation & Location
    if (/hol van|hogy jutok|merre|térkép|útvonal|navigál|hogyan érek|oda vezet/.test(q)) {
        detected.push('navigation');
    }

    // 10. Itinerary & Planning (pár óra / egész nap / terv)
    if (/útiterv|programterv|napra jövünk|napos program|mit csináljunk|ajánlj egy napot|pár (óra|nap)|fél nap|egész nap|megyek kőszegre|mit nézzek|hova menjek|mit ajánlasz/.test(q)) {
        detected.push('itinerary');
    }

    // 10. General smalltalk (greetings & general questions)
    if (/^(szia|hello|helló|hali|jó napot|üdv|hey|hi\b)|^(hogy vagy|mi a helyzet|mizu|köszönöm|köszi|kösz)/.test(q) && detected.length === 0) {
        return ['smalltalk'];
    }

    // 11. General unknown → still try to respond (don't block)
    if (detected.length === 0) return ['unknown'];

    const PRIORITY = {
        emergency: 200,
        parking: 100,
        itinerary: 70,
        food_general: 60,
        attractions: 55,
        leisure: 50,
        events: 40,
        hotels: 30,
        navigation: 10,
        smalltalk: 1,
        unknown: 0
    };

    detected.sort((a, b) => (PRIORITY[b] || 0) - (PRIORITY[a] || 0));
    return [...new Set(detected)]; // Return unique, sorted intents
}
