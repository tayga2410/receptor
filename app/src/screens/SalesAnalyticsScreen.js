import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subDays, subMonths } from 'date-fns';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { getCurrencySymbol } from '../utils/currency';

const SalesAnalyticsScreen = () => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState('week');

  useEffect(() => {
    loadAnalytics();
  }, [periodType]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate;

      switch (periodType) {
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const response = await api.sales.getAnalytics(
        startDate.toISOString(),
        now.toISOString()
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.periodSelector}>
        {['week', 'month', 'quarter'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              periodType === period && styles.periodButtonActive,
            ]}
            onPress={() => setPeriodType(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                periodType === period && styles.periodButtonTextActive,
              ]}
            >
              {t(`period_${period}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="cash" size={24} color={COLORS.success} />
          <Text style={styles.summaryLabel}>{t('total_revenue')}</Text>
          <Text style={styles.summaryValue}>
            {analytics?.revenue?.toFixed(2) || '0.00'} {currencySymbol}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="coin" size={24} color={COLORS.error} />
          <Text style={styles.summaryLabel}>{t('total_cost')}</Text>
          <Text style={styles.summaryValue}>
            {analytics?.cost?.toFixed(2) || '0.00'} {currencySymbol}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="trending-up" size={24} color={COLORS.accent} />
          <Text style={styles.summaryLabel}>{t('total_profit')}</Text>
          <Text style={[
            styles.summaryValue,
            (analytics?.profit || 0) >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {analytics?.profit?.toFixed(2) || '0.00'} {currencySymbol}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="wallet" size={24} color={COLORS.textLight} />
          <Text style={styles.summaryLabel}>{t('net_profit')}</Text>
          <Text style={[
            styles.summaryValue,
            (analytics?.netProfit || 0) >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {analytics?.netProfit?.toFixed(2) || '0.00'} {currencySymbol}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('expenses')}</Text>
        <View style={styles.expensesCard}>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>{t('monthly_expenses')}</Text>
            <Text style={styles.expenseValue}>
              {analytics?.expenses?.monthly?.toFixed(2) || '0.00'} {currencySymbol}
            </Text>
          </View>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>{t('daily_expenses')}</Text>
            <Text style={styles.expenseValue}>
              {analytics?.expenses?.daily?.toFixed(2) || '0.00'} {currencySymbol}
            </Text>
          </View>
          <View style={[styles.expenseRow, styles.expenseRowTotal]}>
            <Text style={styles.expenseLabelTotal}>{t('period_expenses')}</Text>
            <Text style={styles.expenseValueTotal}>
              {analytics?.expenses?.periodTotal?.toFixed(2) || '0.00'} {currencySymbol}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('top_dishes')}</Text>
        {analytics?.topRecipes?.length > 0 ? (
          analytics.topRecipes.map((dish, index) => (
            <View key={index} style={styles.dishCard}>
              <View style={styles.dishHeader}>
                <Text style={styles.dishRank}>{index + 1}</Text>
                <Text style={styles.dishName}>{dish.name}</Text>
              </View>
              <View style={styles.dishStats}>
                <View style={styles.dishStat}>
                  <Text style={styles.dishStatLabel}>{t('quantity')}</Text>
                  <Text style={styles.dishStatValue}>{dish.quantity}</Text>
                </View>
                <View style={styles.dishStat}>
                  <Text style={styles.dishStatLabel}>{t('total_revenue')}</Text>
                  <Text style={styles.dishStatValue}>
                    {dish.revenue.toFixed(2)} {currencySymbol}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>{t('no_sales_selected_period')}</Text>
        )}
      </View>
    </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  periodButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  summarySection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  summaryCard: {
    width: 172,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  section: {
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  expensesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expenseRowTotal: {
    borderBottomWidth: 0,
    paddingTop: THEME.spacing.md,
    marginTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  expenseLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  expenseLabelTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  expenseValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  expenseValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  dishCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  dishRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  dishStats: {
    flexDirection: 'row',
    gap: THEME.spacing.lg,
  },
  dishStat: {
    flex: 1,
  },
  dishStatLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  dishStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: THEME.spacing.lg,
  },
});

export default SalesAnalyticsScreen;
