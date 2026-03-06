import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { useDialog } from '../contexts/DialogContext';
import { api } from '../services/api';
import { parseDate } from '../utils/date';
import ProfitBarChart from '../components/ProfitBarChart';
import PremiumGate from '../components/PremiumGate';
import useStore from '../store/useStore';

// Статичные локализации (определяются один раз)
const LOCALES = {
  RU: {
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    today: 'Сегодня',
  },
  KZ: {
    monthNames: ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'],
    monthNamesShort: ['Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау', 'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'],
    dayNames: ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'],
    dayNamesShort: ['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'],
    today: 'Бүгін',
  },
  EN: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
  },
};

// Регистрируем все локали один раз при старте
Object.keys(LOCALES).forEach(lang => {
  LocaleConfig.locales[lang] = LOCALES[lang];
});

const SalesCalendarScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const dialog = useDialog();
  const user = useStore((state) => state.user);

  // Проверка подписки
  const isPremium = user?.subscriptionType === 'PREMIUM' || user?.subscriptionType === 'AMBASSADOR';

  // Устанавливаем локаль синхронно используя useMemo (выполняется до рендера)
  const currentLocale = useMemo(() => {
    LocaleConfig.defaultLocale = language;
    return language;
  }, [language]);

  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reload when month changes
  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  // Reload when screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
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
      dialog.alert(t('error'), t('error_load_sales'));
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    navigation.navigate('SalesDay', { date: day.dateString });
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
    <PremiumGate navigation={navigation}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header buttons */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleAnalytics}>
            <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.accent} />
            <Text style={styles.headerButtonText}>{t('analytics')}</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            key={currentLocale}
            current={currentMonth.toISOString().split('T')[0]}
            onDayPress={handleDayPress}
            onMonthChange={(month) => {
              const parsed = parseDate(month.dateString);
              if (parsed) setCurrentMonth(parsed);
            }}
            markedDates={markedDates}
            firstDay={1}
            theme={{
              backgroundColor: COLORS.surface,
              calendarBackground: COLORS.surface,
              textSectionTitleColor: COLORS.textLight,
              selectedDayBackgroundColor: COLORS.accent,
              selectedDayTextColor: COLORS.white,
              todayTextColor: COLORS.accent,
              dayTextColor: COLORS.text,
              textDisabledColor: COLORS.textLight,
              arrowColor: COLORS.accent,
              monthTextColor: COLORS.text,
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {/* Bar Chart */}
        <ProfitBarChart
          markedDates={markedDates}
          onDayPress={handleDayPress}
        />
      </ScrollView>
    </PremiumGate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 0,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.roundness,
    overflow: 'hidden',
  },
});

export default SalesCalendarScreen;
