import { InitOptions } from 'i18next';

// Define supported languages
export const languages = ['en', 'ar'] as const;
export type Language = typeof languages[number];

// Define namespaces for better organization
export const namespaces = [
  'common',
  'auth',
  'customer',
  'provider',
  'booking',
  'services',
  'reviews',
  'profile',
] as const;
export type Namespace = typeof namespaces[number];

// Default language
export const defaultLanguage: Language = 'en';

// Language direction mapping
export const languageDirections: Record<Language, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

// i18next configuration (client-side safe parts)
export const i18nConfig: InitOptions = {
  defaultNS: 'common',
  fallbackNS: 'common',
  fallbackLng: defaultLanguage,
  supportedLngs: languages,
  ns: namespaces,
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  react: {
    useSuspense: false, // Set to false as per existing config, can be true for Next.js 13+ App Router if using Suspense
  },
  // Detection options are client-side specific and fine here
  detection: {
    order: ['path', 'cookie', 'navigator', 'localStorage', 'htmlTag'],
    lookupCookie: 'NEXT_LOCALE',
    lookupFromPathIndex: 0,
    caches: ['cookie'],
    cookieExpirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
  },
};

// Helper function to get language direction
export function getLanguageDirection(language: string): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

// Helper function to format dates according to locale
export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(date);
}

// Helper function to format numbers according to locale
export function formatNumber(number: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(number);
}

// Helper function to format currency according to locale
export function formatCurrency(
  amount: number, 
  locale: string, 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
