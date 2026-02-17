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
import useStore from '../store/useStore';

const getDateLocale = (language) => {
  switch (language) {
    case 'KZ': return kk;
    case 'RU': return ru;
    case 'EN': return enUS;
    default: return ru;
  }
};

// Склонение слова "позиция" в зависимости от языка и числа
const getItemsWord = (count, language) => {
  if (language === 'EN') {
    return count === 1 ? 'item' : 'items';
  }

  if (language === 'KZ') {
    // В казахском нет склонения по числам, но можно использовать разные формы
    return count === 1 ? 'позиция' : 'позиция';
  }

  // Русский язык
  const lastTwo = Math.abs(count) % 100;
  const lastOne = lastTwo % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return 'позиций';
  }
  if (lastOne === 1) {
    return 'позиция';
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return 'позиции';
  }
  return 'позиций';
};

const SalesDayScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const { date } = route.params;
  const user = useStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');
  const [salesData, setSalesData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

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
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  };

  const dailyExpenses = expenses.length > 0
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / getDaysInMonth(date)
    : 0;

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return format(dateObj, 'd MMMM yyyy', { locale: getDateLocale(language) });
  };

  const formatTime = (dateString) => {
    const dateObj = new Date(dateString);
    return format(dateObj, 'HH:mm', { locale: getDateLocale(language) });
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleDeleteOrder = async (orderId) => {
    Alert.alert(
      t('delete_order'),
      t('confirm_delete_order'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.sales.delete(orderId);
              loadSalesForDay();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_sale'));
            }
          },
        },
      ]
    );
  };

  const handleEditOrder = (order) => {
    navigation.navigate('EditSales', { orderId: order.id, date });
  };

  const renderOrderItem = ({ item: order }) => {
    const isExpanded = expandedOrders[order.id];

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => toggleOrderExpand(order.id)}
        >
          <View style={styles.orderHeaderLeft}>
            <MaterialCommunityIcons
              name={isExpanded ? "chevron-down" : "chevron-right"}
              size={20}
              color={COLORS.textLight}
            />
            <View>
              <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
              <Text style={styles.orderItemsCount}>
                {order.items.length} {getItemsWord(order.items.length, language)}
              </Text>
            </View>
          </View>

          <View style={styles.orderHeaderRight}>
            <View style={styles.orderProfitContainer}>
              <Text style={[
                styles.orderProfit,
                order.profit >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(0)} {currencySymbol}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.orderEditButton}
              onPress={() => handleEditOrder(order)}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orderDeleteButton}
              onPress={() => handleDeleteOrder(order.id)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Order Content (expanded) */}
        {isExpanded && (
          <View style={styles.orderContent}>
            {/* Items list */}
            {order.items.map((item) => {
              const revenue = item.snapshotSalePrice * item.quantity;
              return (
                <View key={item.id} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName}>{item.recipeName || t('unnamed_recipe')}</Text>
                  <Text style={styles.orderItemQty}>{item.quantity} x {item.snapshotSalePrice.toFixed(0)}</Text>
                  <Text style={styles.orderItemTotal}>{revenue.toFixed(0)} {currencySymbol}</Text>
                </View>
              );
            })}

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>{t('revenue')}</Text>
                <Text style={styles.orderSummaryValue}>{order.revenue.toFixed(0)} {currencySymbol}</Text>
              </View>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>{t('cost')}</Text>
                <Text style={styles.orderSummaryValue}>-{order.cost.toFixed(0)} {currencySymbol}</Text>
              </View>
              {order.expenseItemsTotal > 0 && (
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>{t('expense_items')}</Text>
                  <Text style={styles.orderSummaryValue}>-{order.expenseItemsTotal.toFixed(0)} {currencySymbol}</Text>
                </View>
              )}
              {order.deliveryFee > 0 && (
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>{t('delivery')}</Text>
                  <Text style={styles.orderSummaryValue}>-{order.deliveryFee.toFixed(0)} {currencySymbol}</Text>
                </View>
              )}
              <View style={[styles.orderSummaryRow, styles.orderProfitRow]}>
                <Text style={styles.orderProfitLabel}>{t('profit')}</Text>
                <Text style={[
                  styles.orderProfitValue,
                  order.profit >= 0 ? styles.profitPositive : styles.profitNegative
                ]}>
                  {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(0)} {currencySymbol}
                </Text>
              </View>
            </View>
          </View>
        )}
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

  const hasSales = salesData?.orders && salesData.orders.length > 0;
  const netProfit = salesData
    ? salesData.totalProfit - dailyExpenses - (salesData.totalExpenseItems || 0) - (salesData.totalDeliveryFee || 0)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </View>

      {hasSales ? (
        <FlatList
          data={salesData.orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>{t('total_revenue')}</Text>
                  <Text style={styles.summaryValue}>{salesData.totalRevenue.toFixed(0)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>{t('total_cost')}</Text>
                  <Text style={styles.summaryValue}>{salesData.totalCost.toFixed(0)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>{t('orders_count')}</Text>
                  <Text style={styles.summaryValue}>{salesData.orders.length}</Text>
                </View>
              </View>
              <View style={styles.summaryDividerLine} />
              {/* Deductions */}
              <View style={styles.deductionsRow}>
                <Text style={styles.deductionsLabel}>{t('daily_expenses')}</Text>
                <Text style={styles.deductionsValue}>-{dailyExpenses.toFixed(0)} {currencySymbol}</Text>
              </View>
              {(salesData.totalExpenseItems > 0 || salesData.totalDeliveryFee > 0) && (
                <View style={styles.deductionsRow}>
                  <Text style={styles.deductionsLabel}>{t('expense_items')} + {t('delivery')}</Text>
                  <Text style={styles.deductionsValue}>-{((salesData.totalExpenseItems || 0) + (salesData.totalDeliveryFee || 0)).toFixed(0)} {currencySymbol}</Text>
                </View>
              )}
              <View style={styles.summaryDividerLine} />
              <View style={styles.netProfitRow}>
                <Text style={styles.netProfitLabel}>{t('net_profit')}</Text>
                <Text style={[
                  styles.netProfitValue,
                  netProfit >= 0 ? styles.profitPositive : styles.profitNegative
                ]}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)} {currencySymbol}
                </Text>
              </View>
            </View>
          }
        />
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddSales', { date })}
      >
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
    marginBottom: THEME.spacing.sm,
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
  },
  summaryDividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: THEME.spacing.sm,
  },
  deductionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deductionsLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  deductionsValue: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  netProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  netProfitValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  listContent: {
    paddingBottom: 100,
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  orderTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderItemsCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  orderProfitContainer: {
    marginRight: THEME.spacing.sm,
  },
  orderProfit: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  orderItemPrice: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 20,
    textAlign: 'center',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: THEME.spacing.sm,
  },
  orderSection: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: THEME.spacing.xs,
  },
  expenseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  expenseItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  expenseItemName: {
    fontSize: 13,
    color: COLORS.text,
  },
  expenseItemValue: {
    fontSize: 13,
    color: COLORS.error,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  deliveryLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  deliveryValue: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  orderSummary: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  orderSummaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  orderSummaryValue: {
    fontSize: 12,
    color: COLORS.text,
  },
  orderProfitRow: {
    marginTop: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderProfitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderProfitValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
