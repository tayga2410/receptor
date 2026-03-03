import { parseISO, format, isValid } from 'date-fns';

/**
 * Безопасный парсинг даты для iOS и Android
 * iOS требует строгий ISO формат, Android более терпим
 *
 * @param {string|Date} dateInput - Дата в любом формате
 * @returns {Date|null} - Валидный объект Date или null
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;

  // Уже Date объект
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }

  // Строка
  if (typeof dateInput === 'string') {
    // Пробуем ISO формат сначала (YYYY-MM-DDTHH:mm:ss)
    let parsed = parseISO(dateInput);
    if (isValid(parsed)) return parsed;

    // Пробуем формат YYYY-MM-DD (частая проблема на iOS)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Добавляем время для корректного парсинга на iOS
      parsed = parseISO(`${dateInput}T00:00:00`);
      if (isValid(parsed)) return parsed;
    }

    // Последняя попытка через native Date
    const nativeDate = new Date(dateInput);
    if (isValid(nativeDate)) return nativeDate;
  }

  return null;
};

/**
 * Форматирование даты в строку YYYY-MM-DD для API и календаря
 *
 * @param {string|Date} dateInput - Дата
 * @returns {string} - Строка в формате YYYY-MM-DD
 */
export const formatDateISO = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
};

/**
 * Проверка валидности даты
 *
 * @param {string|Date} dateInput - Дата
 * @returns {boolean}
 */
export const isValidDate = (dateInput) => {
  return parseDate(dateInput) !== null;
};

/**
 * Получить количество дней в месяце
 *
 * @param {string|Date} dateInput - Дата
 * @returns {number}
 */
export const getDaysInMonth = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return 30;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return new Date(year, month, 0).getDate();
};
