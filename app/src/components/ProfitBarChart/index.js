import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, THEME } from '../../theme/colors';
import { useTranslation } from '../../contexts/TranslationContext';
import BarChartItem from './BarChartItem';
import {
  CHART_CONFIG,
  buildChartData,
  calculateYAxisRange,
  calculateCenterOffset,
} from './utils';

const { BAR_WIDTH, BAR_GAP, CHART_HEIGHT } = CHART_CONFIG;

const ProfitBarChart = ({ markedDates, onDayPress }) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);

  // Генерация данных графика
  const chartData = useMemo(
    () => buildChartData(markedDates, selectedDate, t),
    [markedDates, selectedDate, t]
  );

  // Расчёт диапазона Y-оси (только для yMax)
  const { yMax } = useMemo(() => calculateYAxisRange(chartData), [chartData]);

  // Индекс выбранного дня в массиве
  const selectedIndex = chartData.findIndex(d => d.date === selectedDate);

  // Центровка на выбранном дне
  useEffect(() => {
    if (selectedIndex >= 0 && scrollViewRef.current) {
      const screenWidth = Dimensions.get('window').width;
      const offset = calculateCenterOffset(selectedIndex, screenWidth);

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: offset,
          animated: true,
        });
      }, 100);
    }
  }, [selectedDate, selectedIndex]);

  // Обработчик клика по столбцу
  const handleBarPress = (date) => {
    setSelectedDate(date);
    onDayPress?.({ dateString: date });
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('daily_chart')}</Text>
      </View>

      {/* График */}
      <View style={styles.chartWrapper}>
        {/* Область со скроллом */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces
          decelerationRate="fast"
          snapToInterval={BAR_WIDTH + BAR_GAP}
        >
          {chartData.map((day) => (
            <BarChartItem
              key={day.date}
              data={day}
              yMax={yMax}
              isSelected={day.date === selectedDate}
              onPress={handleBarPress}
            />
          ))}
        </ScrollView>
      </View>

      {/* Пустое состояние */}
      {chartData.every(d => !d.hasData) && (
        <View style={styles.emptyOverlay}>
          <MaterialCommunityIcons name="chart-bar-off" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>{t('no_data_period')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.md,
    marginTop: 0,
    borderRadius: THEME.roundness * 2,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartWrapper: {
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  emptyOverlay: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default ProfitBarChart;
