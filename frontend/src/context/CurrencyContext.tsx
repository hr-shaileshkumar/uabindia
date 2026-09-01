"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CurrencyInfo = {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // rate vs USD
};

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", rate: 1.0 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", rate: 83.50 },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", rate: 0.78 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", rate: 3.67 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬", rate: 1.35 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", rate: 155.20 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺", rate: 1.52 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", rate: 1.36 },
];

interface CurrencyContextType {
  activeCurrency: CurrencyInfo;
  setCurrency: (code: string) => void;
  formatMoney: (amountInInr: number) => string;
  supportedCurrencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType>({
  activeCurrency: SUPPORTED_CURRENCIES[1], // INR default
  setCurrency: () => {},
  formatMoney: (amt) => `₹${amt.toLocaleString()}`,
  supportedCurrencies: SUPPORTED_CURRENCIES,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [activeCurrency, setActiveCurrency] = useState<CurrencyInfo>(SUPPORTED_CURRENCIES[1]);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency");
    if (saved) {
      const match = SUPPORTED_CURRENCIES.find((c) => c.code === saved);
      if (match) setActiveCurrency(match);
    }
  }, []);

  const setCurrency = (code: string) => {
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (match) {
      setActiveCurrency(match);
      localStorage.setItem("preferred_currency", code);
    }
  };

  const formatMoney = (amountInInr: number) => {
    if (activeCurrency.code === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amountInInr);
    }

    // Convert from INR to active currency via USD base rate
    const inUsd = amountInInr / 83.50;
    const converted = inUsd * activeCurrency.rate;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: activeCurrency.code,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        activeCurrency,
        setCurrency,
        formatMoney,
        supportedCurrencies: SUPPORTED_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
