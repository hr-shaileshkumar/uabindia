'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale, SUPPORTED_LOCALES, translations } from '@/lib/i18n';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  direction: 'ltr' | 'rtl';
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  direction: 'ltr',
  t: (key, fallback) => fallback || key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('uab_locale') as SupportedLocale;
      if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
        setLocaleState(savedLocale);
      }
    } catch {
      // Ignore localStorage errors in SSR/strict modes
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    if (SUPPORTED_LOCALES[newLocale]) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem('uab_locale', newLocale);
      } catch {}
      // Update HTML document direction and lang
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
        document.documentElement.dir = SUPPORTED_LOCALES[newLocale].direction;
      }
    }
  };

  const direction = SUPPORTED_LOCALES[locale]?.direction || 'ltr';

  const t = (key: string, fallback?: string): string => {
    const localeDict = translations[locale];
    if (localeDict && localeDict[key]) {
      return localeDict[key];
    }
    const defaultDict = translations.en;
    if (defaultDict && defaultDict[key]) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, direction, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};
