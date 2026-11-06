"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { GLOBAL_JURISDICTIONS, getCountryJurisdiction, type CountryJurisdiction } from "@/lib/workspace/jurisdictions";
import apiClient from "@/services/apiClient";

interface LocalizationContextType {
  activeCountry: CountryJurisdiction;
  setCountryCode: (code: string) => void;
  availableCountries: CountryJurisdiction[];
  labels: {
    taxId: string;
    nationalId: string;
    socialSecurity: string;
    routingCode: string;
    subdivision: string;
  };
}

const LocalizationContext = createContext<LocalizationContextType>({
  activeCountry: GLOBAL_JURISDICTIONS.IND,
  setCountryCode: () => {},
  availableCountries: Object.values(GLOBAL_JURISDICTIONS),
  labels: {
    taxId: GLOBAL_JURISDICTIONS.IND.taxIdLabel,
    nationalId: GLOBAL_JURISDICTIONS.IND.nationalIdLabel,
    socialSecurity: GLOBAL_JURISDICTIONS.IND.socialSecurityLabel,
    routingCode: GLOBAL_JURISDICTIONS.IND.routingCodeLabel,
    subdivision: GLOBAL_JURISDICTIONS.IND.subdivisionType,
  },
});

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [activeCountry, setActiveCountry] = useState<CountryJurisdiction>(GLOBAL_JURISDICTIONS.IND);

  useEffect(() => {
    // Try to load current tenant localization profile from API
    apiClient
      .get("/localization/current-tenant")
      .then((res) => {
        if (res.data?.countryCode) {
          setActiveCountry(getCountryJurisdiction(res.data.countryCode));
        }
      })
      .catch(() => {
        // Fallback to local storage or IND default
        const saved = localStorage.getItem("preferred_country");
        if (saved) setActiveCountry(getCountryJurisdiction(saved));
      });
  }, []);

  const setCountryCode = (code: string) => {
    const matched = getCountryJurisdiction(code);
    setActiveCountry(matched);
    localStorage.setItem("preferred_country", code);
  };

  return (
    <LocalizationContext.Provider
      value={{
        activeCountry,
        setCountryCode,
        availableCountries: Object.values(GLOBAL_JURISDICTIONS),
        labels: {
          taxId: activeCountry.taxIdLabel,
          nationalId: activeCountry.nationalIdLabel,
          socialSecurity: activeCountry.socialSecurityLabel,
          routingCode: activeCountry.routingCodeLabel,
          subdivision: activeCountry.subdivisionType,
        },
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  return useContext(LocalizationContext);
}
