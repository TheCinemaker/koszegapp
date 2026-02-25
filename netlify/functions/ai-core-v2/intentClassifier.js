/**
 * intentClassifier.js – ai-core-v2 (multi-intent)
 * Returns an ARRAY of intents - a single message can contain multiple.
 * No license plate detection here (→ entityExtractor).
 */
export function detectIntent(query) {
    const q = query.toLowerCase();
    const intents = [];

    if (/szia|hello|hali|jó napot|üdv|hey|hi|szevasz|cső/.test(q)) intents.push('smalltalk');

    // Parking INFO (questions about cost/rules) vs COMMAND (buy/start)
    if (/mennyibe kerül.*parkol|ingyenes.*parkol|fizetős.*parkol|kell.*parkolójegy|kell.*parkolni|parkolás ingyen|parkolás.*ár|parkolás.*díj|parkolás.*infó/.test(q)) {
        intents.push('parking_info');
    } else if (/vegyél.*parkoló|indíts.*parkolást|parkol|parkolás|parkolnék|parkolhatok|parkolójegy/.test(q)) {
        intents.push('parking');
    }

    // Food: added café, coffee, 'innék', 'ennék', 'kóstolnék'
    if (/pizza|étterem|enni|kávé|kávézó|fagylalt|büfé|kaja|hamburger|burger|kebab|kebap|lángos|bor|fröccs|innék|ennék|kóstolnék/.test(q)) intents.push('food');

    // Attractions: added 'megnéznék', 'felfedez'
    if (/vár|látnivaló|múzeum|séta|néznék|megnéznék|kirándulás|látnék|felfedez/.test(q)) intents.push('attractions');

    if (/merre|hol van|hogyan jutok|vezess|térkép|útvonal/.test(q)) intents.push('navigation');
    if (/patika|orvos|mentő|rendőr|baleset|rosszul|segítség/.test(q)) intents.push('emergency');
    if (/szállás|hotel|panzió|ágy|éjszaka/.test(q)) intents.push('hotels');
    if (/program|esemény|fesztivál|koncert|előadás/.test(q)) intents.push('events');

    if (intents.length === 0) intents.push('unknown');

    return intents;
}
