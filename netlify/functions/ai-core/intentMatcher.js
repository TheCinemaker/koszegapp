export function detectIntent(query) {
    const q = query.toLowerCase();

    // 🚫 TILTOTT ZÓNÁK - elsőként ellenőrizd!
    if (/koszeg1532|1532|jegyrendelés|ticket|játék|game|ételrendelés/.test(q)) return 'restricted';

    // Food & Drink - JAVÍTVA: food_general (nem food!)
    if (/rendel|házhoz|kiszállítás|futár|enni|beülni|étterem|pizz|burger|tészta|kávé|sör|ebéd|vacsor|reggeli|éhes|szomjas/.test(q)) {
        return 'food_general';
    }

    // Events & Programs
    if (/program|esemény|koncert|mozi|színház|fesztivál|buli|mikor|hétvégén|ma este|jegye|wallet|belépő/.test(q)) return 'events';

    // Attractions & Sightseeing
    if (/látnivaló|műemlék|vár|templom|kilátó|múzeum|séta|túra|nevezetesség|szobor|tér/.test(q)) return 'attractions';

    // Accomodation
    if (/szállás|hotel|panzió|kemping|apartman|szoba|vendégház|alvás/.test(q)) return 'hotels';

    // Parking & Transport - JAVÍTVA: parkoló, parkolhatok, parkolni hozzáadva
    if (/parkol|parkoló|parkolhatok|parkolni|mélygarázs|automata|megállni/.test(q)) return 'parking';

    // Leisure & Sport
    if (/sport|túra|bicikli|kerékpár|játszótér|futás|edzés|szabadidő/.test(q)) return 'leisure';

    // Emergency & Services
    if (/segítség|orvos|patika|gyógyszertár|rendőr|mentő|tűzoltó|kórház|ügyelet/.test(q)) return 'emergency';

    // Navigation & Location
    if (/hol van|hogy jutok|merre|térkép|útvonal|navigál|oda/.test(q)) return 'navigation';

    // Greetings & Smalltalk
    if (/^szia|^heló|^hali|^jó napot|^üdv|^hogy vagy|^mizu|^köszönöm/.test(q)) return 'smalltalk';

    // Default
    return 'unknown';
}
