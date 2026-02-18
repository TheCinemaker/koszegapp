export function detectIntent(query) {
    const q = query.toLowerCase();

    // Food & Drink
    if (/enni|inni|étel|ital|étterem|kávé|pizz|bár|borozó|cukrászda|ebéd|vacsor|reggeli|éhes|szomjas/.test(q)) return 'food';

    // Events & Programs
    if (/program|esemény|koncert|mozi|színház|fesztivál|buli|mikor|hétvégén|ma este/.test(q)) return 'events';

    // Attractions & Sightseeing
    if (/látnivaló|műemlék|vár|templom|kilátó|múzeum|séta|túra|nevezetesség|szobor|tér/.test(q)) return 'attractions';

    // Accomodation
    if (/szállás|hotel|panzió|kemping|apartman|szoba|vendégház|alvás/.test(q)) return 'hotels';

    // Parking & Transport
    if (/parkol|mélygarázs|jegy|automata|megállni|autó|busz|vonat/.test(q)) return 'parking';

    // Leisure & Sport
    if (/sport|túra|bicikli|kerékpár|játszótér|futás|edzés|szabadidő/.test(q)) return 'leisure';

    // Emergency & Services
    if (/segítség|orvos|patika|gyógyszertár|rendőr|mentő|tűzoltó|kórház|ügyelet/.test(q)) return 'emergency';

    // Navigation & Location
    if (/hol van|hogy jutok|merre|térkép|útvonal/.test(q)) return 'navigation';

    // Greetings & Smalltalk
    if (/^szia|^heló|^hali|^jó napot|^üdv|^hogy vagy|^mizu|^köszönöm/.test(q)) return 'smalltalk';

    // Default
    return 'unknown';
}
