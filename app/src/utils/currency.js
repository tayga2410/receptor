export const CURRENCIES = {
  KZT: {
    symbol: '₸',
    symbolShort: '₸',
    name: {
      KZ: 'теңге',
      RU: 'тенге',
      EN: 'tenge',
    },
    code: 'KZT',
  },
  RUB: {
    symbol: '₽',
    symbolShort: '₽',
    name: {
      KZ: 'рубль',
      RU: 'рубль',
      EN: 'ruble',
    },
    code: 'RUB',
  },
  KGS: {
    symbol: 'с',
    symbolShort: 'KGS',
    name: {
      KZ: 'сом',
      RU: 'сом',
      EN: 'som',
    },
    code: 'KGS',
  },
  UZS: {
    symbol: "so'm",
    symbolShort: "so'm",
    name: {
      KZ: 'сўм',
      RU: 'сум',
      EN: 'sum',
    },
    code: 'UZS',
  },
  USD: {
    symbol: '$',
    symbolShort: '$',
    name: {
      KZ: 'доллар',
      RU: 'доллар',
      EN: 'dollar',
    },
    code: 'USD',
  },
  EUR: {
    symbol: '€',
    symbolShort: '€',
    name: {
      KZ: 'евро',
      RU: 'евро',
      EN: 'euro',
    },
    code: 'EUR',
  },
};

export const getCurrencySymbol = (currencyCode) => {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
};

export const getCurrencyName = (currencyCode, language = 'RU') => {
  return CURRENCIES[currencyCode]?.name[language] || currencyCode;
};

export const formatCurrency = (amount, currencyCode) => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${amount}${symbol}`;
};

export const formatPricePerUnit = (price, currency, unit) => {
  const symbol = getCurrencySymbol(currency);
  return `${price}${symbol}/${unit}`;
};
