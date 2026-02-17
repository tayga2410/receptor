import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';

const getDateLocale = (language) => {
  switch (language) {
    case 'KZ': return kk;
    case 'RU': return ru;
    case 'EN': return enUS;
    default: return ru;
  }
};

const SalesDayScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const { date } = route.params;
  const [salesData, setSalesData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSalesForDay();
      loadExpenses();
    }, [date])
  );

  const loadSalesForDay = async () => {
    try {
      setLoading(true);
      const response = await api.sales.getByDate(date);
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error('Failed to load sales:', error);
      Alert.alert(t('error'), t('error_load_sales'));
    } finally {
      setLoading(false);
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

  const getDaysInMonth = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  };

  const dailyExpenses = expenses.length > 0
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / getDaysInMonth(date)
    : 0;

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return format(dateObj, 'd MMMM yyyy', { locale: getDateLocale(language) });
  };

  const handleAddPortion = async (salesRecordId, itemId) => {
    try {
      await api.sales.addPortion(salesRecordId, itemId, 1);
      loadSalesForDay();
    } catch (error) {
      Alert.alert(t('error'), t('error_delete_sale'));
    }
  };

  const handleRemovePortion = async (salesRecordId, itemId, currentQuantity) => {
    if (currentQuantity <= 1) {
      // If only 1 portion left, confirm complete removal
      Alert.alert(
        t('delete'),
        t('confirm_delete_recipe'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await api.sales.removeItem(salesRecordId, itemId);
                loadSalesForDay();
              } catch (error) {
                Alert.alert(t('error'), t('error_delete_sale'));
              }
            },
          },
        ]
      );
      return;
    }

    try {
      await api.sales.removePortion(salesRecordId, itemId, 1);
      loadSalesForDay();
    } catch (error) {
      Alert.alert(t('error'), t('error_delete_sale'));
    }
  };

  const handleRemoveItem = async (salesRecordId, itemId) => {
    Alert.alert(
      t('delete'),
      t('confirm_delete_recipe'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.sales.removeItem(salesRecordId, itemId);
              loadSalesForDay();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_sale'));
            }
          },
        },
      ]
    );
  };

  const renderSaleItem = ({ item }) => {
    const revenue = item.snapshotSalePrice * item.quantity;
    const cost = item.snapshotCostPrice * item.quantity;
    const profit = revenue - cost;

    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <Text style={styles.recipeName}>{item.recipeName || t('unnamed_recipe')}</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePortion(item.salesRecordId, item.id, item.quantity)}
            >
              <MaterialCommunityIcons name="minus" size={18} color={COLORS.error} />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddPortion(item.salesRecordId, item.id)}
            >
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.success} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.saleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('sale_price')}:</Text>
            <Text style={styles.detailValue}>
              {item.snapshotSalePrice.toFixed(2)} {getCurrencySymbol(item.currency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('cost_at_moment')}:</Text>
            <Text style={styles.detailValue}>
              {item.snapshotCostPrice.toFixed(2)} {getCurrencySymbol(item.currency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('profit_per_portion')}:</Text>
            <Text style={[
              styles.detailValue,
              profit >= 0 ? styles.profitPositive : styles.profitNegative
            ]}>
              {(item.snapshotSalePrice - item.snapshotCostPrice).toFixed(2)} {getCurrencySymbol(item.currency)}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('total')}:</Text>
            <Text style={styles.totalValue}>
              {revenue.toFixed(2)} {getCurrencySymbol(item.currency)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteItemButton}
          onPress={() => handleRemoveItem(item.salesRecordId, item.id)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
          <Text style={styles.deleteItemText}>{t('delete_recipe')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const hasSales = salesData?.items && salesData.items.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </View>

      {hasSales ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>{t('total_revenue')}</Text>
                <Text style={styles.summaryValue}>{salesData.totalRevenue.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>{t('total_cost')}</Text>
                <Text style={styles.summaryValue}>{salesData.totalCost.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.summaryDividerLine} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>{t('daily_expenses')}</Text>
                <Text style={[styles.summaryValue, styles.expensesValue]}>{dailyExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>{t('total_profit')}</Text>
                <Text style={[
                  styles.summaryValue,
                  salesData.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative
                ]}>
                  {salesData.totalProfit.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={[styles.summaryDividerLine, styles.netProfitDivider]} />
            <View style={styles.netProfitRow}>
              <Text style={styles.netProfitLabel}>{t('net_profit')}</Text>
              <Text style={[
                styles.netProfitValue,
                (salesData.totalProfit - dailyExpenses) >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {(salesData.totalProfit - dailyExpenses).toFixed(2)}
              </Text>
            </View>
          </View>

          <FlatList
            data={salesData.items}
            renderItem={renderSaleItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cash-register" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>{t('no_sales_this_day')}</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddSales', { date })}
          >
            <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
            <Text style={styles.addFirstButtonText}>{t('add_sale')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasSales && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddSales', { date })}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
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
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
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
  summary: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
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
  listContent: {
    padding: THEME.spacing.md,
  },
  saleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleDetails: {
    gap: THEME.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  totalRow: {
    marginTop: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  deleteItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteItemText: {
    fontSize: 13,
    color: COLORS.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: COLORS.accent,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness * 2,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
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

export default SalesDayScreen;
