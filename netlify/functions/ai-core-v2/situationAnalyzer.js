/**
 * situationAnalyzer.js – ai-core-v2
 * Determines who is in Kőszeg or approaching.
 * Returns rich context for response generation.
 */

const KOSZEG = { lat: 47.3895, lng: 16.541 };
const CITY_RADIUS_KM = 5;

function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180)
        * Math.cos(b.lat * Math.PI / 180)
        * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function analyzeSituation(frontendContext, conversationContext = {}) {
    const loc = frontendContext?.location;
    const speed = loc?.speed ?? frontendContext?.speed ?? 0;

    // Alaphelyzet
    let situation = {
        speed,
        status: 'unknown',
        anyoneInCity: false,
        wifeInCity: false,
        approaching: false
    };

    // USER helyzete GPS alapján
    if (loc?.lat && loc?.lng) {
        const distanceKm = haversineKm({ lat: loc.lat, lng: loc.lng }, KOSZEG);

        if (distanceKm <= CITY_RADIUS_KM) {
            situation.status = 'in_city';
            situation.userDistance = parseFloat(distanceKm.toFixed(2));
            situation.anyoneInCity = true;
        } else {
            situation.status = 'not_in_city';
            situation.userDistance = Math.round(distanceKm);
            situation.approaching = speed > 10 && distanceKm < 30;
        }
    }

    // KI VAN MÉG A VÁROSBAN a beszélgetés alapján?
    const lastMessages = conversationContext.history?.slice(-3) || [];
    const lastUserMessages = lastMessages
        .filter(m => m.role === 'user')
        .map(m => m.content.toLowerCase())
        .join(' ');

    // Feleség említése + jelenlét
    if (/(feleség|asszony|párom).*(már ott|ott van|bent van|kint van)/.test(lastUserMessages)) {
        situation.wifeInCity = true;
        situation.anyoneInCity = true;
        situation.whoIsThere = 'wife';
    }

    // Ha a user már bent van VAGY a feleség bent van
    situation.canParkNow = situation.status === 'in_city' || situation.wifeInCity;

    return situation;
}

/**
 * Többféle, emberi hangvételű üzenetek
 * Nem LLM – determinisztikus, de változatos
 */
export function buildArrivalMessage(situation, wifeInCity = false) {
    const { userDistance, approaching } = situation;

    // Ha a feleség már ott van
    if (wifeInCity) {
        const messages = [
            "Ó, a feleséged már ott van Kőszegen! Akkor ő már nyugodtan sétálhat, amíg te odaérsz. 😊 Mikor érkezel te?",
            "De jó, a feleséged már Kőszegen van! Akkor addig ő felfedezhet, te pedig nyugodtan vezethetsz. Mikorra várhatlak?",
            "Akkor a feleséged már birtokba vette Kőszeget! 🏰 Mikor csatlakozol hozzá?",
            "A feleséged már ott van? Akkor ő már nyugodtan kereshet egy jó kávézót! Te mikor érkezel?"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Ha úton van a user
    if (approaching) {
        const messages = [
            `Már úton vagy Kőszeg felé (kb. ${userDistance} km)! 🚗 Mondd, mikorra tervezed az érkezést?`,
            `Ahha, szép lassan közeledsz! ${userDistance} km és itt is vagy. Mikor várhatlak pontosan?`,
            `Már csak ${userDistance} km! Mikor érkezel? Addig kitalálok egy jó programot.`,
            `${userDistance} km van hátra. Mennyi idő múlva érkezel?`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Ha még messze van
    if (userDistance > 30) {
        const messages = [
            `Hűha, még ${userDistance} km-re vagy Kőszegtől! Azért egy kis előzetes programtervezés belefér. Mikor érkezel?`,
            `Még ${userDistance} km, de ne aggódj, megéri az út! Mikor várható az érkezés?`,
            `Még messze vagy, de addig is: mikor érkezel? Addig kiguglizom a legjobb programokat!`,
            `${userDistance} km. Azért egy jó program belefér előre. Mikorra várható az érkezés?`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Alapértelmezett
    const defaultMessages = [
        `Látom még nem vagy Kőszegen (${userDistance} km). 😄 Mikor érkezel?`,
        `${userDistance} km-re vagy. Mikor várható az érkezés?`,
        `Még nem vagy itt (${userDistance} km). Mondd, mikor érkezel?`
    ];
    return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

export function buildParkingMessage(situation) {
    const { canParkNow, wifeInCity } = situation;

    if (canParkNow && wifeInCity) {
        const messages = [
            "Ha a feleséged már ott van, akkor nyugodtan indíthatjuk a parkolást! Add meg a rendszámát, és csináljuk. 💪",
            "Akkor a feleséged már parkolhat is! Kérem a rendszámot, és indulhat az SMS parkolás.",
            "Rendben, ha a feleséged már Kőszegen van, akkor neki vegyek parkolójegyet? Add meg a rendszámát!"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    if (canParkNow) {
        return "Mivel már Kőszegen vagy, nyugodtan indulhat a parkolás. Add meg a rendszámot!";
    }

    return "Még nem vagy Kőszegen, de ha odaértél, szólj és elindítom a parkolást!";
}
