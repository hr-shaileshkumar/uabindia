export type CountryJurisdiction = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  taxIdLabel: string;
  nationalIdLabel: string;
  socialSecurityLabel: string;
  routingCodeLabel: string;
  subdivisionType: string;
  subdivisions: string[];
};

export const GLOBAL_JURISDICTIONS: Record<string, CountryJurisdiction> = {
  IND: {
    code: "IND",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    taxIdLabel: "GSTIN / PAN",
    nationalIdLabel: "Aadhaar Card",
    socialSecurityLabel: "Provident Fund (UAN)",
    routingCodeLabel: "IFSC Code",
    subdivisionType: "State / UT",
    subdivisions: [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
      "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
      "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
      "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ],
  },
  USA: {
    code: "USA",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    timezone: "America/New_York",
    taxIdLabel: "EIN / Federal Tax ID",
    nationalIdLabel: "Social Security Number (SSN)",
    socialSecurityLabel: "Social Security Administration",
    routingCodeLabel: "ABA Routing Number",
    subdivisionType: "State",
    subdivisions: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
      "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
      "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
      "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
      "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
      "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
      "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
  },
  GBR: {
    code: "GBR",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    timezone: "Europe/London",
    taxIdLabel: "VAT Registration / UTR",
    nationalIdLabel: "National Insurance (NI)",
    socialSecurityLabel: "State Pension Reference",
    routingCodeLabel: "Sort Code",
    subdivisionType: "Region / County",
    subdivisions: [
      "England", "Scotland", "Wales", "Northern Ireland", "Greater London", "West Midlands", "Greater Manchester", "Yorkshire"
    ],
  },
  ARE: {
    code: "ARE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    currencySymbol: "د.إ",
    timezone: "Asia/Dubai",
    taxIdLabel: "Tax Registration Number (TRN)",
    nationalIdLabel: "Emirates ID",
    socialSecurityLabel: "GPSSA Reference",
    routingCodeLabel: "IBAN",
    subdivisionType: "Emirate",
    subdivisions: [
      "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
    ],
  },
  SGP: {
    code: "SGP",
    name: "Singapore",
    flag: "🇸🇬",
    currency: "SGD",
    currencySymbol: "S$",
    timezone: "Asia/Singapore",
    taxIdLabel: "UEN / GST Number",
    nationalIdLabel: "NRIC / FIN",
    socialSecurityLabel: "CPF Number",
    routingCodeLabel: "Bank / Branch Code",
    subdivisionType: "Region",
    subdivisions: [
      "Central Region", "East Region", "North Region", "North-East Region", "West Region"
    ],
  },
  GLOBAL: {
    code: "GLOBAL",
    name: "International",
    flag: "🌐",
    currency: "USD",
    currencySymbol: "$",
    timezone: "UTC",
    taxIdLabel: "Tax Identification Number",
    nationalIdLabel: "National Citizen ID",
    socialSecurityLabel: "Social Security / Pension ID",
    routingCodeLabel: "Routing / SWIFT Code",
    subdivisionType: "Region / Province",
    subdivisions: ["North Region", "South Region", "East Region", "West Region", "Central District"],
  }
};

export function getCountryJurisdiction(code?: string): CountryJurisdiction {
  if (!code) return GLOBAL_JURISDICTIONS.IND;
  return GLOBAL_JURISDICTIONS[code.toUpperCase()] || GLOBAL_JURISDICTIONS.GLOBAL;
}
