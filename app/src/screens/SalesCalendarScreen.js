import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { getCurrencySymbol } from '../utils/currency';

const SalesCalendarScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [todayData, setTodayData] = useState(null);
  const [expenses, setExpenses] = useState([]);

  // Reload when month changes
  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  // Reload when screen gets focus (to update after deletions)
  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
      loadTodayData();
      loadExpenses();
    }, [])
  );

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await api.sales.getCalendar(year, month);
      const data = await response.json();

      const formatted = {};
      const today = format(new Date(), 'yyyy-MM-dd');

      for (const [date, info] of Object.entries(data)) {
        formatted[date] = {
          marked: true,
          dotColor: '#4CAF50',
          ...info,
        };
      }

      // Подсветка сегодняшнего дня
      formatted[today] = {
        ...formatted[today],
        selected: true,
        selectedColor: COLORS.accent,
      };

      setMarkedDates(formatted);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      Alert.alert(t('error'), t('error_load_sales'));
    } finally {
      setLoading(false);
    }
  };

  const loadTodayData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.sales.getByDate(today);
      const data = await response.json();
      setTodayData(data);
    } catch (error) {
      console.error('Failed to load today data:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await api.expenses.getAll();
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  };

  const getMonthNames = () => [
    t('january'), t('february'), t('march'), t('april'),
    t('may'), t('june'), t('july'), t('august'),
    t('september'), t('october'), t('november'), t('december')
  ];

  const getDayNames = () => [
    t('sun'), t('mon'), t('tue'), t('wed'),
    t('thu'), t('fri'), t('sat')
  ];

  const dailyExpenses = expenses.length > 0
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / getDaysInMonth(new Date())
    : 0;

  const netProfitToday = todayData
    ? todayData.totalProfit - dailyExpenses
    : -dailyExpenses;

  const handleDayPress = (day) => {
    navigation.navigate('SalesDay', { date: day.dateString });
  };

  const handleTodayPress = () => {
    setCurrentMonth(new Date());
  };

  const handleAnalytics = () => {
    navigation.navigate('SalesAnalytics');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleTodayPress}>
          <MaterialCommunityIcons name="calendar-today" size={20} color={COLORS.accent} />
          <Text style={styles.headerButtonText}>{t('today')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleAnalytics}>
          <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.accent} />
          <Text style={styles.headerButtonText}>{t('analytics')}</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        current={currentMonth.toISOString().split('T')[0]}
        onDayPress={handleDayPress}
        onMonthChange={(month) => setCurrentMonth(new Date(month.dateString))}
        markedDates={markedDates}
        monthNames={getMonthNames()}
        firstDay={1}
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.surface,
          textSectionTitleColor: COLORS.textLight,
          selectedDayBackgroundColor: COLORS.accent,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.accent,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.textLight,
          arrowColor: COLORS.accent,
          monthTextColor: COLORS.text,
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      {todayData && todayData.totalRevenue > 0 && (
        <View style={styles.todayCard}>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>{t('revenue_today')}</Text>
              <Text style={styles.todayStatValue}>
                {todayData.totalRevenue.toFixed(2)} {getCurrencySymbol(user?.currency || 'KZT')}
              </Text>
            </View>
            <View style={styles.todayStatDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>{t('daily_expenses')}</Text>
              <Text style={[styles.todayStatValue, styles.expensesValue]}>
                {dailyExpenses.toFixed(2)} {getCurrencySymbol(user?.currency || 'KZT')}
              </Text>
            </View>
            <View style={styles.todayStatDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>{t('net_profit_today')}</Text>
              <Text style={[
                styles.todayStatValue,
                netProfitToday >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {netProfitToday.toFixed(2)} {getCurrencySymbol(user?.currency || 'KZT')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  todayCard: {
    margin: THEME.spacing.md,
    marginTop: 0,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayStatLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  todayStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  todayStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: THEME.spacing.sm,
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  expensesValue: {
    color: COLORS.warning || '#FF9800',
  },
});

export default SalesCalendarScreen;
