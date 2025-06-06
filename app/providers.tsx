'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ThemeProvider } from 'next-themes';
import { languages, namespaces, defaultLanguage, i18nConfig } from '@/i18n/config';

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    ...i18nConfig,
    react: {
      useSuspense: false,
    },
  });

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  // State to track if we're mounted on client-side
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Initialize MSW in development mode only
    if (process.env.NODE_ENV === 'development') {
      import('@/mocks/browser')
        .then(({ startMSW }) => startMSW())
        .catch((err) => console.error('Error starting MSW:', err));
    }
  }, []);

  // Set up language direction based on current language
  useEffect(() => {
    const handleLanguageChange = () => {
      const currentLang = i18n.language || defaultLanguage;
      document.documentElement.lang = currentLang;
      document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
      document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    };

    handleLanguageChange();
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Don't render providers until client-side hydration is complete
  if (!isMounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
