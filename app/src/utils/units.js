import { TRANSLATIONS } from '../constants/translations';

// Маппинг русских shortName на ключи переводов
const UNIT_TRANSLATION_KEYS = {
  'кг': 'unit_kg',
  'г': 'unit_g',
  'мг': 'unit_mg',
  'л': 'unit_l',
  'мл': 'unit_ml',
  'м': 'unit_m',
  'см': 'unit_cm',
  'шт': 'unit_pcs',
};

// Функция для получения переведённого названия единицы
export const translateUnit = (shortName, language) => {
  const key = UNIT_TRANSLATION_KEYS[shortName];
  if (!key) return shortName;

  const translations = TRANSLATIONS[language] || TRANSLATIONS.RU;
  return translations[key] || shortName;
};

// Функция для сокращения и перевода названий единиц измерения
export const formatUnit = (name, shortName, language) => {
  const short = shortName || name;

  // Сначала пробуем перевести shortName
  const translated = translateUnit(short, language);
  if (translated !== short) {
    return translated;
  }

  // Если не получилось, сокращаем name (важен порядок - сначала более специфичные!)
  const n = name?.toLowerCase() || '';
  if (n.includes('сантиметр') || short === 'см') return translateUnit('см', language);
  if (n.includes('миллилитр') || short === 'мл') return translateUnit('мл', language);
  if (n.includes('миллиграмм') || short === 'мг') return translateUnit('мг', language);
  if (n.includes('килограмм') || short === 'кг') return translateUnit('кг', language);
  if (n.includes('грамм') || short === 'г') return translateUnit('г', language);
  if (n.includes('литр') || short === 'л') return translateUnit('л', language);
  if (n.includes('метр') || short === 'м') return translateUnit('м', language);
  if (n.includes('штука') || short === 'шт') return translateUnit('шт', language);
  if (n.includes('дан')) return translateUnit('шт', language); // для казахского

  return short?.substring(0, 3) || '';
};
