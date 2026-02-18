import { isUserInCity } from '../utils/cityUtils';

const KOSZEG_CENTER = {
    lat: 47.3892,
    lng: 16.5410
};

export function getAppMode(location) {
    if (!location) return "unknown";

    const inCity = isUserInCity(location, KOSZEG_CENTER, 20);
    if (inCity) return "city";

    const nearCity = isUserInCity(location, KOSZEG_CENTER, 80);
    if (nearCity) return "approaching";

    return "remote";
}
