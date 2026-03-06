import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { useDialog } from '../contexts/DialogContext';
import { api } from '../services/api';

const CalculatorScreen = () => {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [expenses, setExpenses] = useState([]);
  const [profitPerDish, setProfitPerDish] = useState('');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.expenses.getAll();

      if (!response.ok) {
        console.error('Failed to load expenses:', response.status, response.statusText);
        setExpenses([]);
        return;
      }

      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!newExpenseName.trim()) {
      dialog.alert(t('error'), t('error_enter_expense_name'));
      return;
    }

    try {
      const response = await api.expenses.create({
        name: newExpenseName.trim(),
        amount: parseFloat(newExpenseAmount) || 0,
      });
      const newExpense = await response.json();
      setExpenses([...expenses, newExpense]);
      setNewExpenseName('');
      setNewExpenseAmount('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
      dialog.alert(t('error'), t('error_add_expense'));
    }
  };

  const removeExpense = async (id) => {
    const confirmed = await dialog.confirm(
      t('delete'),
      t('confirm_delete_expense'),
      {
        confirmText: t('delete'),
        cancelText: t('cancel'),
        destructive: true,
      }
    );

    if (confirmed) {
      try {
        await api.expenses.delete(id);
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (error) {
        console.error('Failed to delete expense:', error);
        dialog.alert(t('error'), t('error_delete_expense_failed'));
      }
    }
  };

  const updateExpenseName = async (id, name) => {
    const newExpenses = expenses.map(e => e.id === id ? { ...e, name } : e);
    setExpenses(newExpenses);

    try {
      await api.expenses.update(id, { name });
    } catch (error) {
      console.error('Failed to update expense name:', error);
    }
  };

  const updateExpenseAmount = async (id, amount) => {
    const amountNum = parseFloat(amount) || 0;
    const newExpenses = expenses.map(e => e.id === id ? { ...e, amount: amountNum } : e);
    setExpenses(newExpenses);

    try {
      await api.expenses.update(id, { amount: amountNum });
    } catch (error) {
      console.error('Failed to update expense amount:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const profitNum = parseFloat(profitPerDish) || 0;
  const dishesPerMonth = profitNum > 0 ? Math.ceil(totalExpenses / profitNum) : 0;
  const dishesPerDay = dishesPerMonth > 0 ? (dishesPerMonth / 30).toFixed(1) : '0';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Expenses section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('monthly_expenses')}</Text>

          {expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <TextInput
                style={styles.expenseNameInput}
                value={expense.name}
                onChangeText={(text) => updateExpenseName(expense.id, text)}
                placeholderTextColor={COLORS.textLight}
              />
              <View style={styles.expenseAmountWrapper}>
                <TextInput
                  style={styles.expenseAmountInput}
                  value={expense.amount?.toString() || ''}
                  onChangeText={(text) => updateExpenseAmount(expense.id, text)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencySuffix}>₸</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeExpense(expense.id)}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          {!showAddForm ? (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.accent} />
              <Text style={styles.addButtonText}>{t('add_expense')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addExpenseForm}>
              <TextInput
                style={styles.newExpenseInput}
                value={newExpenseName}
                onChangeText={setNewExpenseName}
                placeholder={t('expense_name_placeholder')}
                placeholderTextColor={COLORS.textLight}
              />
              <View style={styles.row}>
                <View style={styles.amountInputWrapper}>
                  <TextInput
                    style={styles.newExpenseInput}
                    value={newExpenseAmount}
                    onChangeText={setNewExpenseAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.currencySuffixSmall}>₸</Text>
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={addExpense}>
                  <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setShowAddForm(false);
                  setNewExpenseName('');
                  setNewExpenseAmount('');
                }}>
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('total_expenses')}:</Text>
            <Text style={styles.totalValue}>{totalExpenses.toLocaleString()} ₸/{t('month_short')}</Text>
          </View>
        </View>

        {/* Profit per dish section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profit_per_dish')}</Text>
          <View style={styles.profitInputWrapper}>
            <TextInput
              style={styles.profitInput}
              value={profitPerDish}
              onChangeText={setProfitPerDish}
              placeholder="500"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySuffixLarge}>₸</Text>
          </View>
          <Text style={styles.hint}>{t('profit_hint')}</Text>
        </View>

        {/* Results section */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>{t('need_to_sell')}</Text>

          <View style={styles.resultRow}>
            <View style={styles.resultCard}>
              <Text style={styles.resultNumber}>{dishesPerMonth}</Text>
              <Text style={styles.resultLabel}>{t('dishes_per_month')}</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultNumber}>{dishesPerDay}</Text>
              <Text style={styles.resultLabel}>{t('dishes_per_day')}</Text>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.textLight} />
            <Text style={styles.noticeText}>{t('break_even_notice')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseNameInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 4,
  },
  expenseAmountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    paddingHorizontal: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
  },
  expenseAmountInput: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    width: 70,
    textAlign: 'right',
    paddingVertical: 6,
  },
  currencySuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  deleteButton: {
    padding: THEME.spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
  },
  addExpenseForm: {
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newExpenseInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  amountInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    paddingRight: THEME.spacing.sm,
  },
  currencySuffixSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    width: 44,
    height: 44,
    borderRadius: THEME.roundness,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    width: 44,
    height: 44,
    borderRadius: THEME.roundness,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: THEME.spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  profitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
  },
  profitInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    padding: THEME.spacing.md,
  },
  currencySuffixLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    paddingRight: THEME.spacing.md,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
  },
  resultsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  resultCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: THEME.spacing.xs,
  },
  resultLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});

export default CalculatorScreen;
