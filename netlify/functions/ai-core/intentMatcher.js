export function detectIntent(query) {
    const q = query.toLowerCase();
    const detected = [];

    // 🚫 TILTOTT ZÓNÁK
    if (/koszeg1532|1532|jegyrendelés|ticket|játék|game|ételrendelés/.test(q)) return ['restricted'];

    // 1. Food
    if (/étterem|ebéd|vacsora|gasztro|pizza|kávé|süti|cukrász|ennék|eszek|enni|beülni|reggeli|kocsma|borozó|fagy|gyors/.test(q)) {
        detected.push('food_general');
    }

    // 2. Attractions & Sights (including time combinations)
    if (/látnivaló|műemlék|templom|vár|múzeum|szobor|kilátó|túra|séta|park|tó|nézzek meg|látni|érdekessé|csinál/.test(q) || (/ór/.test(q) && /megnéz|csinál|ajánlj/.test(q))) {
        detected.push('attractions');
    }

    // 3. Events & Programs
    if (/program|esemény|koncert|fesztivál|kiállítás|buli|szórakozás|mozi|színház|mai|hétvégi/.test(q)) {
        detected.push('events');
    }

    // Accomodation
    if (/szállás|hotel|panzió|kemping|apartman|szoba|vendégház|alvás/.test(q)) {
        detected.push('hotels');
    }

    // Parking & Transport
    if (/parkol|parkoló|parkolhatok|parkolni|mélygarázs|automata|megállni/.test(q)) {
        detected.push('parking');
    }

    // Leisure & Sport
    if (/sport|túra|bicikli|kerékpár|játszótér|futás|edzés|szabadidő/.test(q)) {
        detected.push('leisure');
    }

    // Emergency & Services
    if (/segítség|orvos|patika|gyógyszertár|rendőr|mentő|tűzoltó|kórház|ügyelet/.test(q)) {
        detected.push('emergency');
    }

    // Navigation & Location
    if (/hol van|hogy jutok|merre|térkép|útvonal|navigál|oda/.test(q)) {
        detected.push('navigation');
    }

    // Itinerary & Planning
    if (/útiterv|terv|napra jövünk|napos program|mit csináljunk|ajánlj egy napot/.test(q)) {
        detected.push('itinerary');
    }

    // Greetings & Smalltalk
    if (/^szia|^heló|^hali|^jó napot|^üdv|^hogy vagy|^mizu|^köszönöm/.test(q) && detected.length === 0) {
        return ['smalltalk'];
    }

    return detected.length > 0 ? detected : ['unknown'];
}
