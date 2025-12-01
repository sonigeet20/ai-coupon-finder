export const CURRENCY_MAP: Record<string, { symbol: string; code: string; locale: string }> = {
  'United States': { symbol: '$', code: 'USD', locale: 'en-US' },
  'United Kingdom': { symbol: '£', code: 'GBP', locale: 'en-GB' },
  'Canada': { symbol: 'CA$', code: 'CAD', locale: 'en-CA' },
  'Australia': { symbol: 'A$', code: 'AUD', locale: 'en-AU' },
  'India': { symbol: '₹', code: 'INR', locale: 'en-IN' },
  'Thailand': { symbol: '฿', code: 'THB', locale: 'th-TH' },
  'Singapore': { symbol: 'S$', code: 'SGD', locale: 'en-SG' },
  'Japan': { symbol: '¥', code: 'JPY', locale: 'ja-JP' },
  'South Korea': { symbol: '₩', code: 'KRW', locale: 'ko-KR' },
  'China': { symbol: '¥', code: 'CNY', locale: 'zh-CN' },
  'Germany': { symbol: '€', code: 'EUR', locale: 'de-DE' },
  'France': { symbol: '€', code: 'EUR', locale: 'fr-FR' },
  'Spain': { symbol: '€', code: 'EUR', locale: 'es-ES' },
  'Italy': { symbol: '€', code: 'EUR', locale: 'it-IT' },
  'Netherlands': { symbol: '€', code: 'EUR', locale: 'nl-NL' },
  'Brazil': { symbol: 'R$', code: 'BRL', locale: 'pt-BR' },
  'Mexico': { symbol: 'MX$', code: 'MXN', locale: 'es-MX' },
  'UAE': { symbol: 'د.إ', code: 'AED', locale: 'ar-AE' },
  'Saudi Arabia': { symbol: '﷼', code: 'SAR', locale: 'ar-SA' },
  'South Africa': { symbol: 'R', code: 'ZAR', locale: 'en-ZA' },
  'Worldwide': { symbol: '$', code: 'USD', locale: 'en-US' },
};

export const getCurrencyForCountry = (country: string) => {
  return CURRENCY_MAP[country] || { symbol: '$', code: 'USD', locale: 'en-US' };
};

export const formatCurrency = (amount: number, country: string): string => {
  const currency = getCurrencyForCountry(country);
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toFixed(0)}`;
  }
};
