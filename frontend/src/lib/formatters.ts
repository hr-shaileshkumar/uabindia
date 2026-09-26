/**
 * Enterprise Global Currency & Date/Time Formatters
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED ',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  CHF: 'CHF ',
  SGD: 'SG$',
};

export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return '$0.00';

  const curr = (currencyCode || 'USD').toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDateTime(
  dateInput: Date | string | null | undefined,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function formatRelativeTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDateTime(date, 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDate(
  dateInput: Date | string | null | undefined,
  locale: string = 'en-IN'
): string {
  if (!dateInput) return '-';
  const str = typeof dateInput === 'string' ? dateInput.slice(0, 10) : dateInput;
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateInput);
  }
}

export function getCurrencySymbol(currencyCode: string = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}
