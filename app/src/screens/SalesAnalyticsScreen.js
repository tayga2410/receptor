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
import { format, startOfMonth, startOfQuarter, subMonths } from 'date-fns';
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
      let endDate;

      switch (periodType) {
        case 'month':
          startDate = startOfMonth(now);
          // End of current month
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          startDate = startOfQuarter(now);
          // End of current quarter
          const quarterEndMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
          endDate = new Date(now.getFullYear(), quarterEndMonth, 0);
          break;
        case 'halfYear':
          startDate = subMonths(now, 6);
          endDate = now;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          // End of current year
          endDate = new Date(now.getFullYear(), 12, 0);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Set start of day and end of day to avoid timezone issues
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const response = await api.sales.getAnalytics(
        startDate.toISOString(),
        endDate.toISOString()
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
        {['month', 'quarter', 'halfYear', 'year'].map((period) => (
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

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>{t('total_revenue')}</Text>
            <Text style={styles.summaryValue}>{analytics?.revenue?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>{t('total_cost')}</Text>
            <Text style={styles.summaryValue}>{analytics?.cost?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
        <View style={styles.summaryDividerLine} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>{t('expenses_this_period')}</Text>
            <Text style={[styles.summaryValue, styles.expensesValue]}>{analytics?.expenses?.periodTotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>{t('expense_items')}</Text>
            <Text style={[styles.summaryValue, styles.expensesValue]}>{analytics?.expenses?.saleItems?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
        <View style={[styles.summaryDividerLine, styles.netProfitDivider]} />
        <View style={styles.netProfitRow}>
          <Text style={styles.netProfitLabel}>{t('net_profit')}</Text>
          <Text style={[
            styles.netProfitValue,
            (analytics?.netProfit || 0) >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {analytics?.netProfit?.toFixed(2) || '0.00'}
          </Text>
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
                  <Text style={styles.dishStatLabel}>{t('sold')}</Text>
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
    fontSize: 12,
    color: COLORS.text,
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  summaryCard: {
    margin: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: THEME.spacing.sm,
  },
  summaryDividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: THEME.spacing.sm,
  },
  netProfitDivider: {
    marginTop: THEME.spacing.sm,
  },
  netProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: THEME.spacing.xs,
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  netProfitValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summarySection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
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
