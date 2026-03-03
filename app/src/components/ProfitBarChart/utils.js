import { format } from 'date-fns';
import { parseDate } from '../../utils/date';

// Маппинг английских дней недели на ключи переводов
const DAY_WEEK_MAP = {
  'Mon': 'mon',
  'Tue': 'tue',
  'Wed': 'wed',
  'Thu': 'thu',
  'Fri': 'fri',
  'Sat': 'sat',
  'Sun': 'sun',
};

// Константы графика
export const CHART_CONFIG = {
  BAR_WIDTH: 32,
  BAR_GAP: 4,
  CHART_HEIGHT: 110,
  Y_AXIS_WIDTH: 36, // Уменьшен отступ слева
  VISIBLE_BARS: 7,
  DAYS_RANGE: 15, // Дней до и после центра
};

// Цвета для розовой темы проекта
export const CHART_COLORS = {
  positive: {
    gradientStart: '#FF69B4',
    gradientEnd: '#FF85C1',
    glow: 'rgba(255, 105, 180, 0.4)',
  },
  negative: {
    gradientStart: '#FF7675',
    gradientEnd: '#E17055',
    glow: 'rgba(255, 118, 117, 0.4)',
  },
};

/**
 * Генерация данных для графика
 * @param {Object} markedDates - Данные календаря { '2026-02-15': { totalProfit: 15000, ... } }
 * @param {string} centerDate - Дата центра в формате 'yyyy-MM-dd'
 * @param {Function} t - Функция перевода
 * @returns {Array} Массив объектов { date, dayOfMonth, dayOfWeek, value, hasData, isProfit }
 */
export const buildChartData = (markedDates, centerDate, t) => {
  const center = parseDate(centerDate);
  if (!center) return [];

  const days = [];

  for (let i = -CHART_CONFIG.DAYS_RANGE; i <= CHART_CONFIG.DAYS_RANGE; i++) {
    const date = new Date(center);
    date.setDate(center.getDate() + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeekEng = format(date, 'EEE');
    const dayOfWeekKey = DAY_WEEK_MAP[dayOfWeekEng] || 'mon';

    const dayData = markedDates[dateStr];
    // Используем totalProfit вместо totalSales
    const value = dayData?.totalProfit ?? dayData?.totalSales ?? 0;
    const hasData = !!dayData;

    days.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      dayOfWeek: t ? t(dayOfWeekKey) : dayOfWeekEng,
      value,
      hasData,
      isProfit: value >= 0,
    });
  }

  return days;
};

/**
 * Расчёт максимального И минимального значения для Y-оси (с учётом убытков)
 */
export const calculateYAxisRange = (chartData) => {
  const values = chartData.map(d => d.value);
  const maxValue = Math.max(0, ...values);
  const minValue = Math.min(0, ...values);

  // Если все значения положительные
  if (minValue >= 0) {
    return { yMin: 0, yMax: calculateNiceMax(maxValue) };
  }

  // Если есть убытки - симметричная шкала
  const absMax = Math.max(Math.abs(minValue), maxValue);
  const niceMax = calculateNiceMax(absMax);

  return { yMin: -niceMax, yMax: niceMax };
};

/**
 * Расчёт "красивого" максимального значения
 */
const calculateNiceMax = (maxValue) => {
  if (maxValue === 0) return 10000;

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;

  let niceMax;
  if (normalized <= 1) niceMax = 1;
  else if (normalized <= 2) niceMax = 2;
  else if (normalized <= 5) niceMax = 5;
  else niceMax = 10;

  return niceMax * magnitude;
};

// Для обратной совместимости
export const calculateYAxisMax = (chartData) => {
  const { yMax } = calculateYAxisRange(chartData);
  return yMax;
};

/**
 * Форматирование подписей Y-оси
 */
export const formatYAxisLabel = (value) => {
  if (value === 0) return '0';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) return `${sign}${(absValue / 1000000).toFixed(1)}M`;
  if (absValue >= 1000) return `${sign}${(absValue / 1000).toFixed(0)}K`;
  return `${sign}${absValue.toFixed(0)}`;
};

/**
 * Расчёт offset для центровки выбранного бара
 */
export const calculateCenterOffset = (selectedIndex, screenWidth) => {
  const { BAR_WIDTH, BAR_GAP, Y_AXIS_WIDTH } = CHART_CONFIG;
  const barWidthWithGap = BAR_WIDTH + BAR_GAP;
  const chartAreaWidth = screenWidth - Y_AXIS_WIDTH;

  // Offset чтобы выбранный бар был по центру
  const centerOffset = (selectedIndex * barWidthWithGap) - (chartAreaWidth / 2) + (BAR_WIDTH / 2);

  return Math.max(0, centerOffset);
};

/**
 * Генерация подписей для Y-оси
 * Ноль всегда внизу (на уровне основания столбцов)
 */
export const generateYAxisLabels = (yMin, yMax) => {
  // Только положительные значения — 4 метки, ноль внизу
  if (yMin >= 0) {
    return [
      formatYAxisLabel(yMax),      // Вверху
      formatYAxisLabel(yMax * 0.66),
      formatYAxisLabel(yMax * 0.33),
      '0',                          // Внизу (основание)
    ];
  }

  // Если есть убытки — пока оставляем как было
  return [
    formatYAxisLabel(yMax),
    formatYAxisLabel(yMax / 2),
    '0',
    formatYAxisLabel(yMin / 2),
    formatYAxisLabel(yMin),
  ];
};

/**
 * Определение цвета для столбца
 */
export const getBarColors = (value) => {
  if (value >= 0) return CHART_COLORS.positive;
  return CHART_COLORS.negative;
};
