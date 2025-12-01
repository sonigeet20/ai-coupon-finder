export const BRAND_DOMAINS: Record<string, Record<string, string>> = {
  'Amazon': {
    'United States': 'amazon.com',
    'United Kingdom': 'amazon.co.uk',
    'Canada': 'amazon.ca',
    'Germany': 'amazon.de',
    'France': 'amazon.fr',
    'Spain': 'amazon.es',
    'Italy': 'amazon.it',
    'Japan': 'amazon.co.jp',
    'India': 'amazon.in',
    'Australia': 'amazon.com.au',
    'Brazil': 'amazon.com.br',
    'Mexico': 'amazon.com.mx',
    'Netherlands': 'amazon.nl',
    'Singapore': 'amazon.sg',
    'UAE': 'amazon.ae',
    'Saudi Arabia': 'amazon.sa',
  },
  'Apple': {
    'United States': 'apple.com/us',
    'United Kingdom': 'apple.com/uk',
    'Canada': 'apple.com/ca',
    'Germany': 'apple.com/de',
    'France': 'apple.com/fr',
    'Spain': 'apple.com/es',
    'Italy': 'apple.com/it',
    'Japan': 'apple.com/jp',
    'India': 'apple.com/in',
    'Australia': 'apple.com/au',
    'Brazil': 'apple.com/br',
    'Mexico': 'apple.com/mx',
    'Netherlands': 'apple.com/nl',
    'Singapore': 'apple.com/sg',
    'Thailand': 'apple.com/th',
    'South Korea': 'apple.com/kr',
    'China': 'apple.com/cn',
  },
  'Nike': {
    'United States': 'nike.com',
    'United Kingdom': 'nike.com/gb',
    'Canada': 'nike.com/ca',
    'Germany': 'nike.com/de',
    'France': 'nike.com/fr',
    'Spain': 'nike.com/es',
    'Italy': 'nike.com/it',
    'Japan': 'nike.com/jp',
    'India': 'nike.com/in',
    'Australia': 'nike.com/au',
    'Brazil': 'nike.com/br',
    'Mexico': 'nike.com/mx',
    'Thailand': 'nike.com/th',
  },
  'Adidas': {
    'United States': 'adidas.com/us',
    'United Kingdom': 'adidas.co.uk',
    'Canada': 'adidas.ca',
    'Germany': 'adidas.de',
    'France': 'adidas.fr',
    'Spain': 'adidas.es',
    'Italy': 'adidas.it',
    'Japan': 'adidas.jp',
    'India': 'adidas.co.in',
    'Australia': 'adidas.com.au',
    'Brazil': 'adidas.com.br',
    'Mexico': 'adidas.mx',
  },
  'Target': {
    'United States': 'target.com',
  },
  'Walmart': {
    'United States': 'walmart.com',
    'Canada': 'walmart.ca',
    'Mexico': 'walmart.com.mx',
  },
  'Best Buy': {
    'United States': 'bestbuy.com',
    'Canada': 'bestbuy.ca',
    'Mexico': 'bestbuy.com.mx',
  },
};

export const localizeUrl = (url: string | null, brandName: string, country: string): string | null => {
  if (!url) return url;

  try {
    const brandDomains = BRAND_DOMAINS[brandName];
    if (!brandDomains) return url;

    const targetDomain = brandDomains[country];
    if (!targetDomain) return url;

    const urlLower = url.toLowerCase();
    if (targetDomain.includes('/')) {
      const [domain, pathPrefix] = targetDomain.split('/');
      if (urlLower.includes(domain.toLowerCase()) && urlLower.includes('/' + pathPrefix.toLowerCase())) {
        return url;
      }
    } else {
      if (urlLower.includes(targetDomain.toLowerCase())) {
        return url;
      }
    }

    return url;
  } catch (error) {
    console.error('Error checking URL localization:', error);
    return url;
  }
};

export const getLocalizedDomain = (brandName: string, country: string): string | null => {
  const brandDomains = BRAND_DOMAINS[brandName];
  if (!brandDomains) return null;

  return brandDomains[country] || brandDomains['United States'] || null;
};
