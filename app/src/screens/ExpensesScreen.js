import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { getCurrencySymbol, CURRENCIES } from '../utils/currency';
import { formatUnit } from '../utils/units';
import PremiumGate from '../components/PremiumGate';

const ExpensesScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');
  const insets = useSafeAreaInsets();

  // Tab state
  const [activeTab, setActiveTab] = useState('monthly');

  // Monthly expenses state
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Expense items state
  const [expenseItems, setExpenseItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [units, setUnits] = useState([]);

  useEffect(() => {
    loadExpenses();
    loadExpenseItems();
    loadUnits();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const response = await api.expenses.getAll();
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      Alert.alert(t('error'), t('error_load_expenses'));
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadExpenseItems = async () => {
    try {
      setLoadingItems(true);
      const response = await api.expenseItems.getAll();
      const data = await response.json();
      setExpenseItems(data);
    } catch (error) {
      console.error('Failed to load expense items:', error);
      Alert.alert(t('error'), t('error_load_expense_items'));
    } finally {
      setLoadingItems(false);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await api.units.getAll();
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  // Monthly expense handlers
  const handleSaveExpense = async () => {
    if (!expenseName.trim() || !expenseAmount.trim()) {
      Alert.alert(t('error'), t('error_fill_all_fields'));
      return;
    }

    try {
      const data = {
        name: expenseName.trim(),
        amount: parseFloat(expenseAmount),
      };

      if (editingExpense) {
        await api.expenses.update(editingExpense.id, data);
      } else {
        await api.expenses.create(data);
      }

      setExpenseModalVisible(false);
      setExpenseName('');
      setExpenseAmount('');
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      Alert.alert(t('error'), t('error_save_expense'));
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount.toString());
    setExpenseModalVisible(true);
  };

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      t('delete'),
      t('confirm_delete_expense'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.expenses.delete(expense.id);
              loadExpenses();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_expense_failed'));
            }
          },
        },
      ]
    );
  };

  // Expense item handlers
  const handleSaveItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !selectedUnitId) {
      Alert.alert(t('error'), t('error_fill_all_fields'));
      return;
    }

    try {
      // Считаем цену за единицу
      const price = parseFloat(itemPrice) || 0;
      const quantity = parseFloat(itemQuantity) || 1;
      const pricePerUnit = quantity > 0 ? price / quantity : price;

      const data = {
        name: itemName.trim(),
        pricePerUnit,
        unitId: selectedUnitId,
        currency: user?.currency || 'KZT',
      };

      if (editingItem) {
        await api.expenseItems.update(editingItem.id, data);
      } else {
        await api.expenseItems.create(data);
      }

      setItemModalVisible(false);
      setItemName('');
      setItemPrice('');
      setItemQuantity('1');
      setSelectedUnitId('');
      setEditingItem(null);
      loadExpenseItems();
    } catch (error) {
      Alert.alert(t('error'), t('error_save_expense_item'));
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.pricePerUnit.toString());
    setItemQuantity('1');
    setSelectedUnitId(item.unitId);
    setItemModalVisible(true);
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      t('delete'),
      t('confirm_delete_expense_item'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.expenseItems.delete(item.id);
              loadExpenseItems();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_expense_failed'));
            }
          },
        },
      ]
    );
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <MaterialCommunityIcons name={item.icon || 'package'} size={24} color={COLORS.accent} />
          <Text style={styles.expenseName}>{item.name}</Text>
        </View>
        <Text style={styles.expenseAmount}>
          {item.amount.toFixed(2)} {currencySymbol}
        </Text>
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditExpense(item)}>
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteExpense(item)}>
          <MaterialCommunityIcons name="delete" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <MaterialCommunityIcons name={item.icon || 'package-variant'} size={24} color={COLORS.accent} />
          <Text style={styles.expenseName}>{item.name}</Text>
        </View>
        <Text style={styles.expenseAmount}>
          {item.pricePerUnit.toFixed(2)} {currencySymbol}/{formatUnit(item.unit?.name, item.unit?.shortName, language)}
        </Text>
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditItem(item)}>
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteItem(item)}>
          <MaterialCommunityIcons name="delete" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const isLoading = loadingExpenses || loadingItems;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <PremiumGate navigation={navigation}>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
              {t('monthly_tab')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'items' && styles.tabActive]}
            onPress={() => setActiveTab('items')}
          >
            <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
              {t('items_tab')}
            </Text>
          </TouchableOpacity>
        </View>

      {activeTab === 'monthly' && (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('total_expenses')}</Text>
            <Text style={styles.summaryAmount}>
              {totalExpenses.toFixed(2)} {currencySymbol}
            </Text>
            <Text style={styles.summaryHint}>{t('monthly_expenses')}</Text>
          </View>

          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setExpenseModalVisible(true)}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={32} color={COLORS.accent} />
                <Text style={styles.addFirstButtonText}>{t('add_first_expense')}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.fab, { bottom: THEME.spacing.xl + insets.bottom }]}
            onPress={() => setExpenseModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </>
      )}

      {activeTab === 'items' && (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.textLight} />
              <Text style={styles.summaryLabel}>{t('expense_items')}</Text>
            </View>
            <Text style={styles.summaryHint}>{t('expense_items_hint')}</Text>
          </View>

          <FlatList
            data={expenseItems}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setItemModalVisible(true)}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={32} color={COLORS.accent} />
                <Text style={styles.addFirstButtonText}>{t('add_first_expense_item')}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.fab, { bottom: THEME.spacing.xl + insets.bottom }]}
            onPress={() => setItemModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </>
      )}

      {/* Monthly Expense Modal */}
      <Modal
        visible={expenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setExpenseModalVisible(false);
          setExpenseName('');
          setExpenseAmount('');
          setEditingExpense(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingExpense ? t('edit') : t('add_expense')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('expense_name_placeholder')}</Text>
              <TextInput
                style={styles.input}
                value={expenseName}
                onChangeText={setExpenseName}
                placeholder={t('expense_rent')}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('amount')}</Text>
              <TextInput
                style={styles.input}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setExpenseModalVisible(false);
                  setExpenseName('');
                  setExpenseAmount('');
                  setEditingExpense(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveExpense}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expense Item Modal */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setItemModalVisible(false);
          setItemName('');
          setItemPrice('');
          setItemQuantity('1');
          setSelectedUnitId('');
          setEditingItem(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? t('edit') : t('add_expense_item')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('expense_item_name')}</Text>
              <TextInput
                style={styles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder={t('expense_item_name')}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('ingredient_price')}</Text>
              <View style={styles.priceRowContainer}>
                <View style={styles.priceSection}>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={itemPrice}
                    onChangeText={setItemPrice}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                  />
                  <Text style={styles.currencyLabel}>
                    {CURRENCIES[user?.currency || 'KZT']?.symbol || user?.currency || '₸'}
                  </Text>
                </View>
                <Text style={styles.forLabel}>{t('for_label')}</Text>
                <View style={styles.quantitySection}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={itemQuantity}
                    onChangeText={setItemQuantity}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('ingredient_unit')}</Text>
              <View style={styles.unitPicker}>
                {units.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitOption,
                      selectedUnitId === unit.id && styles.unitOptionSelected,
                    ]}
                    onPress={() => setSelectedUnitId(unit.id)}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        selectedUnitId === unit.id && styles.unitOptionTextSelected,
                      ]}
                    >
                      {formatUnit(unit.name, unit.shortName, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setItemModalVisible(false);
                  setItemName('');
                  setItemPrice('');
                  setItemQuantity('1');
                  setSelectedUnitId('');
                  setEditingItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </PremiumGate>
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
  tabsContainer: {
    flexDirection: 'row',
    margin: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: THEME.roundness - 2,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    margin: THEME.spacing.md,
    marginTop: 0,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: THEME.spacing.xs,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  summaryHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  expenseNameContainer: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  expenseDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    padding: THEME.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: THEME.spacing.md,
  },
  emptyStateHint: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    margin: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  addFirstButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: THEME.roundness * 2,
    borderTopRightRadius: THEME.roundness * 2,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.lg,
  },
  inputContainer: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: THEME.spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  priceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  priceSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 7,
    height: 48,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    padding: THEME.spacing.sm,
  },
  currencyLabel: {
    flex: 3,
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 48,
  },
  forLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  quantitySection: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  quantityInput: {
    flex: 5,
    height: 48,
    padding: THEME.spacing.sm,
  },
  unitSelector: {
    flex: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  unitOptionSmall: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  unitPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  unitOption: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  unitOptionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  unitOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  unitOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ExpensesScreen;
