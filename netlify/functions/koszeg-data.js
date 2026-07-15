// netlify/functions/koszeg-data.js
// KőszegAI – adatkereső réteg a chatbot search_data toolja mögött.
//
// A public/data/*.json fájlokban keres (attractions, events, restaurants,
// leisure, hidden_gems, hotels). A modell EZEKBŐL dolgozik – így nem hallucinál:
// csak azt mondhatja, ami a találatokban tényleg szerepel.
//
// Betöltés: a deploy saját origin-jéről (fetch) – így dev branch deploy-on,
// production-ön és lokálisan (netlify dev) is működik. Lokális node-tesztnél,
// ha nincs host, a fájlrendszerről olvas (public/data).

import fetchFn from 'node-fetch';
import { readFile } from 'node:fs/promises';

const DATASETS = ['attractions', 'events', 'restaurants', 'leisure', 'hidden_gems', 'hotels'];

// Melegen tartott in-memory cache (a function példány élettartamára).
const cache = new Map();

// Ékezet-érzéketlen normalizálás a kereséshez.
function norm(s) {
    return String(s == null ? '' : s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

async function loadDataset(name, host) {
    if (cache.has(name)) return cache.get(name);

    let raw = null;

    // 1. Origin-fetch (Netlify runtime)
    if (host) {
        try {
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const res = await fetchFn(`${protocol}://${host}/data/${name}.json`);
            if (res.ok) raw = await res.json();
        } catch {
            /* fallback lent */
        }
    }

    // 2. Fájlrendszer fallback (lokális node-teszt)
    if (raw == null) {
        try {
            raw = JSON.parse(await readFile(`public/data/${name}.json`, 'utf8'));
        } catch {
            raw = [];
        }
    }

    // Normalizálás tömbbé (programok.json {datum,esemenyek} – itt nem használjuk)
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.events || []);
    cache.set(name, arr);
    return arr;
}

// Egy elem "kereshető szövege" (név + tagek + leírás + kategória).
function haystack(item) {
    const parts = [
        item.name,
        item.category,
        item.type,
        item.shortDescription,
        item.description,
        item.details && typeof item.details === 'string' ? item.details : '',
        Array.isArray(item.tags) ? item.tags.join(' ') : ''
    ];
    return norm(parts.filter(Boolean).join(' '));
}

// Kompakt, token-takarékos kimenet – csak a döntéshez / megjelenítéshez kell.
function compact(dataset, item) {
    const out = {
        dataset,
        id: item.id,
        name: item.name
    };
    if (item.category) out.category = item.category;
    if (item.type) out.type = item.type;
    if (Array.isArray(item.tags)) out.tags = item.tags.slice(0, 8);
    if (typeof item.rainSafe === 'boolean') out.rainSafe = item.rainSafe;
    if (typeof item.childFriendly === 'boolean') out.childFriendly = item.childFriendly;
    if (typeof item.indoor === 'boolean') out.indoor = item.indoor;
    if (typeof item.romantic === 'number') out.romantic = item.romantic; // 0–10 skála
    if (item.duration) out.duration = item.duration;
    if (item.date) out.date = item.date;
    if (item.time) out.time = item.time;
    if (item.location) out.location = item.location;
    if (item.lengthKm) out.lengthKm = item.lengthKm;
    if (typeof item.price_from === 'number') out.price_from = item.price_from;
    if (typeof item.rating === 'number') out.rating = item.rating;
    if (item.coords) out.coords = item.coords;
    else if (item.coordinates) out.coords = item.coordinates;
    else if (item.lat != null && item.lng != null) out.coords = { lat: item.lat, lng: item.lng };
    // Hivatalos linkek – a modell ezekre mutathat, de újat NEM talál ki.
    if (item.website) out.website = item.website;
    if (item.moreInfoUrl) out.moreInfoUrl = item.moreInfoUrl;
    if (item.mapUrl) out.mapUrl = item.mapUrl;
    // Rövid leírás (token-takarékosan vágva).
    const desc = item.shortDescription || item.description || '';
    if (desc) out.description = String(desc).slice(0, 200);
    return out;
}

/**
 * Keresés a Kőszeg-adatokban.
 * @param {object} params
 *  - query        {string}  kulcsszavak (név/tag/leírás/kategória)
 *  - datasets     {string[]} mely halmazokban (alap: mind a fő)
 *  - rainSafe     {boolean} csak esőbiztos (beltéri) helyek
 *  - childFriendly{boolean} csak gyerekbarát helyek
 *  - indoor       {boolean} csak beltéri
 *  - romantic     {boolean} romantikus (romantic >= 6)
 *  - date_from    {string}  események: ettől a dátumtól (ISO, YYYY-MM-DD)
 *  - date_to      {string}  események: eddig a dátumig
 *  - limit        {number}  max találat halmazonként (alap 6)
 * @param {string} host  event.headers.host (origin-fetchhez)
 */
export async function searchData(params = {}, host) {
    const {
        query = '',
        datasets,
        rainSafe,
        childFriendly,
        indoor,
        romantic,
        date_from,
        date_to,
        limit = 6
    } = params;

    const wanted = Array.isArray(datasets) && datasets.length
        ? datasets.filter((d) => DATASETS.includes(d))
        : DATASETS;

    const tokens = norm(query).split(/\s+/).filter((t) => t.length >= 2);
    const today = new Date().toISOString().slice(0, 10);

    const results = [];
    const counts = {};

    for (const ds of wanted) {
        const arr = await loadDataset(ds, host);
        let matched = arr.filter((item) => {
            // Kulcsszó (ha van): minden token szerepeljen valahol.
            if (tokens.length) {
                const hay = haystack(item);
                if (!tokens.every((t) => hay.includes(t))) return false;
            }
            if (rainSafe === true && item.rainSafe !== true) return false;
            if (childFriendly === true && item.childFriendly !== true) return false;
            if (indoor === true && item.indoor !== true) return false;
            if (romantic === true) {
                const r = typeof item.romantic === 'number' ? item.romantic : (item.romantic ? 10 : 0);
                if (r < 6) return false;
            }
            // Események: dátumszűrés. Alapból csak a mait/jövőbelit adjuk.
            if (ds === 'events' && item.date) {
                const from = date_from || today;
                if (item.date < from) return false;
                if (date_to && item.date > date_to) return false;
            }
            return true;
        });

        // Események dátum szerint, a többi prioritás/rating szerint.
        if (ds === 'events') {
            matched.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        } else {
            matched.sort((a, b) => (b.priority || b.rating || 0) - (a.priority || a.rating || 0));
        }

        counts[ds] = matched.length;
        for (const item of matched.slice(0, limit)) {
            results.push(compact(ds, item));
        }
    }

    return { query, filters: { rainSafe, childFriendly, indoor, romantic, date_from, date_to }, counts, results };
}

export const AVAILABLE_DATASETS = DATASETS;
