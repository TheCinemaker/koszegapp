/**
 * entityExtractor.js – KőszegAI v2
 * Single concern: extract named entities from raw query + context.
 * Intent is NOT extracted here.
 */
export function extractEntities(query, context = {}) {
    const entities = {};
    const normalized = query.replace(/[\s\-]/g, '');
    const q = query.toLowerCase();

    // --- KI (alany) ---
    if (/\b(feleségem|feleség|asszony|párom|nejem|hitvesem)\b/.test(q)) {
        entities.subject = 'wife';
        entities.subjectGender = 'female';
    } else if (/\b(férjem|uram|párom|hitvesem)\b/.test(q)) {
        entities.subject = 'husband';
        entities.subjectGender = 'male';
    } else if (/\b(barátom|barátnőm|haver|csajom|pasim)\b/.test(q)) {
        entities.subject = 'friend';
    } else if (/\b(én|nekem|magamnak)\b/.test(q) || !entities.subject) {
        entities.subject = 'user';  // alapértelmezett
    }

    // --- HOL VAN (jelenlét) ---
    if (/\b(már ott van|ott van|bent van|már bent|már kint|ott van már)\b/.test(q)) {
        entities.presence = 'already_there';
        entities.presenceConfidence = 0.9;
    } else if (/\b(érkezem|jövök|megyek|indulok|úton vagyok)\b/.test(q)) {
        entities.presence = 'on_the_way';
        entities.presenceConfidence = 0.8;
    } else if (/\b(megyek haza|visszamegyek|távozom)\b/.test(q)) {
        entities.presence = 'leaving';
    }

    // --- MIKOR ---
    if (/\b(most|azonnal|rögtön|nyomban|mindjárt)\b/.test(q)) {
        entities.timing = 'now';
        entities.timingConfidence = 0.9;
    } else if (/\b(már|eddig|máris)\b/.test(q)) {
        entities.timing = 'already';
    }

    // --- Időtartam ---
    const durationMatch = query.match(/(\d+)\s*(óra|h\b)/i);
    if (durationMatch) {
        entities.duration = parseInt(durationMatch[1], 10);
        entities.timing = 'in_future';
    }

    // --- Időpont ---
    const timeMatch = query.match(/(\d{1,2})[.:](\d{2})\s*(óra|kor)?/);
    if (timeMatch) {
        entities.time = `${timeMatch[1]}:${timeMatch[2]}`;
    }

    // --- Rendszám ---
    const plateMatch = normalized.match(/[a-zA-Z]{2,4}\d{3}/i);
    if (plateMatch) {
        entities.licensePlate = plateMatch[0].toUpperCase();
    }

    // --- Mobilitás ---
    if (/gyalog|sétálva|gyalogosan|gógyál/.test(q)) entities.mobility = 'walking';
    if (/\bautó\b|kocsival|autóval|vezetek|kocsival vagyok/.test(q)) entities.mobility = 'car';
    if (/bicaj|bicikli|bringa|kerékpár/.test(q)) entities.mobility = 'bike';
    if (/busz|vonat|tömegközlekedés/.test(q)) entities.mobility = 'public';

    return entities;
}
