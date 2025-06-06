// next-i18next.config.js
module.exports = {
  i18n: {
    // List of supported locales
    locales: ['en', 'ar'],
    // Default locale when visiting a non-locale prefixed path
    defaultLocale: 'en',
    // Locale detection strategies
    localeDetection: true,
  },
  // Where translations will be stored
  localePath: './public/locales',
  // Namespaces to load
  ns: [
    'common',
    'auth',
    'customer',
    'provider',
    'booking',
    'services',
    'reviews',
    'profile',
  ],
  // Default namespace used if not specified
  defaultNS: 'common',
  // Use built-in language detector
  detection: {
    order: ['path', 'cookie', 'navigator', 'localStorage', 'htmlTag'],
    lookupCookie: 'NEXT_LOCALE',
    lookupFromPathIndex: 0,
    caches: ['cookie'],
    cookieExpirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
  },
  // React specific options
  react: {
    useSuspense: false,
  },
  // Other i18next options
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  // Special handling for RTL languages
  // This will be used by custom components to set the correct text direction
  languageDirections: {
    en: 'ltr',
    ar: 'rtl',
  },
};
