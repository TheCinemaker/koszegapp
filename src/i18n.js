import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// HU
import huCommon from './locales/hu/common.json';
import huHome from './locales/hu/home.json';
import huPass from './locales/hu/pass.json';
import huScanner from './locales/hu/scanner.json';
import huEvents from './locales/hu/events.json';
import huAttractions from './locales/hu/attractions.json';
import huGastronomy from './locales/hu/gastronomy.json';
import huInfo from './locales/hu/info.json';
import huHotels from './locales/hu/hotels.json';
import huLeisure from './locales/hu/leisure.json';
import huParking from './locales/hu/parking.json';
import huAuth from './locales/hu/auth.json';
import huPrivacy from './locales/hu/privacy.json';
import huBooking from './locales/hu/booking.json';

// EN
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enPass from './locales/en/pass.json';
import enScanner from './locales/en/scanner.json';
import enEvents from './locales/en/events.json';
import enAttractions from './locales/en/attractions.json';
import enGastronomy from './locales/en/gastronomy.json';
import enInfo from './locales/en/info.json';
import enHotels from './locales/en/hotels.json';
import enLeisure from './locales/en/leisure.json';
import enParking from './locales/en/parking.json';
import enAuth from './locales/en/auth.json';
import enPrivacy from './locales/en/privacy.json';
import enBooking from './locales/en/booking.json';

// DE
import deCommon from './locales/de/common.json';
import deHome from './locales/de/home.json';
import dePass from './locales/de/pass.json';
import deScanner from './locales/de/scanner.json';
import deEvents from './locales/de/events.json';
import deAttractions from './locales/de/attractions.json';
import deGastronomy from './locales/de/gastronomy.json';
import deInfo from './locales/de/info.json';
import deHotels from './locales/de/hotels.json';
import deLeisure from './locales/de/leisure.json';
import deParking from './locales/de/parking.json';
import deAuth from './locales/de/auth.json';
import dePrivacy from './locales/de/privacy.json';
import deBooking from './locales/de/booking.json';

const resources = {
  hu: {
    common: huCommon,
    home: huHome,
    pass: huPass,
    scanner: huScanner,
    events: huEvents,
    attractions: huAttractions,
    gastronomy: huGastronomy,
    info: huInfo,
    hotels: huHotels,
    leisure: huLeisure,
    parking: huParking,
    auth: huAuth,
    privacy: huPrivacy,
    booking: huBooking
  },
  en: {
    common: enCommon,
    home: enHome,
    pass: enPass,
    scanner: enScanner,
    events: enEvents,
    attractions: enAttractions,
    gastronomy: enGastronomy,
    info: enInfo,
    hotels: enHotels,
    leisure: enLeisure,
    parking: enParking,
    auth: enAuth,
    privacy: enPrivacy,
    booking: enBooking
  },
  de: {
    common: deCommon,
    home: deHome,
    pass: dePass,
    scanner: deScanner,
    events: deEvents,
    attractions: deAttractions,
    gastronomy: deGastronomy,
    info: deInfo,
    hotels: deHotels,
    leisure: deLeisure,
    parking: deParking,
    auth: deAuth,
    privacy: dePrivacy,
    booking: deBooking
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'hu',
    fallbackLng: 'hu',
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;
