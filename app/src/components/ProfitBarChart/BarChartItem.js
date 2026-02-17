import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';
import { CHART_CONFIG, getBarColors } from './utils';

const { BAR_WIDTH, BAR_GAP, CHART_HEIGHT } = CHART_CONFIG;

const BarChartItem = ({ data, yMax, isSelected, onPress }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  // Расчёт высоты столбца (минимум 4px чтобы был виден)
  const barHeight = yMax > 0 && data.hasData
    ? Math.max(4, (Math.abs(data.value) / yMax) * CHART_HEIGHT)
    : 0;
  const isPositive = data.value >= 0;

  // Цвета для градиента
  const colors = getBarColors(data.value);

  // Анимация появления
  useEffect(() => {
    Animated.spring(animatedHeight, {
      toValue: barHeight,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [barHeight]);

  const isToday = data.date === new Date().toISOString().split('T')[0];

  // Форматирование значения над столбцом
  const formatValue = (value) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(1)}K`;
    }
    return `${sign}${absValue.toFixed(0)}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { marginRight: BAR_GAP }]}
      onPress={() => onPress(data.date)}
      activeOpacity={0.7}
    >
      {/* Контейнер графика — значение + столбец */}
      <View style={styles.chartArea}>
        {data.hasData ? (
          <Animated.View style={{ height: animatedHeight, width: '100%', alignItems: 'center' }}>
            {/* Значение ПРЯМО над столбцом */}
            <Text style={[
              styles.valueLabel,
              isPositive ? styles.valuePositive : styles.valueNegative
            ]}>
              {formatValue(data.value)}
            </Text>

            {/* Столбик с градиентом */}
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bar}
            />
          </Animated.View>
        ) : null}
      </View>

      {/* Подпись дня */}
      <Text style={[
        styles.dayLabel,
        isToday && styles.dayLabelToday,
        isSelected && styles.dayLabelSelected,
      ]}>
        {data.dayOfMonth}
      </Text>

      {/* День недели */}
      <Text style={styles.weekdayLabel}>
        {data.dayOfWeek}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: BAR_WIDTH,
    alignItems: 'center',
  },
  chartArea: {
    height: CHART_HEIGHT, 
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  valuePositive: {
    color: '#FF69B4',
  },
  valueNegative: {
    color: '#FF7675',
  },
  bar: {
    width: BAR_WIDTH - 8,
    flex: 1, // Занимает всё оставшееся место
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    fontWeight: '400',
  },
  dayLabelToday: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  dayLabelSelected: {
    fontWeight: '700',
  },
  weekdayLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default BarChartItem;
