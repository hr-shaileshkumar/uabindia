'use client';

import React from 'react';
import { useI18n } from '@/context/I18nContext';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`relative inline-flex items-center gap-1 text-sm ${className || ''}`}>
      <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        className="bg-transparent text-slate-700 dark:text-slate-200 border-none rounded focus:ring-1 focus:ring-blue-500 py-1 pl-1 pr-4 text-xs font-medium cursor-pointer"
        aria-label="Select Language"
      >
        {Object.values(SUPPORTED_LOCALES).map((loc) => (
          <option key={loc.code} value={loc.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            {loc.nativeName} ({loc.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
};
