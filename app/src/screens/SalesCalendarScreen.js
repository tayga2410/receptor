import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';

const SalesCalendarScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await api.sales.getCalendar(year, month);
      const data = await response.json();

      const formatted = {};
      for (const [date, info] of Object.entries(data)) {
        formatted[date] = {
          marked: true,
          dotColor: '#4CAF50',
          ...info,
        };
      }

      setMarkedDates(formatted);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      Alert.alert(t('error'), t('error_load_sales'));
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    navigation.navigate('SalesDay', { date: dateStr });
  };

  const handleTodayPress = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleAddSale = () => {
    const dateStr = selectedDate || new Date().toISOString().split('T')[0];
    navigation.navigate('AddSales', { date: dateStr });
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

      <TouchableOpacity style={styles.fab} onPress={handleAddSale}>
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: THEME.spacing.lg,
    bottom: THEME.spacing.xl,
    backgroundColor: COLORS.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default SalesCalendarScreen;
