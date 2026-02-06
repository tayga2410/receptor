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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { getCurrencySymbol } from '../utils/currency';

const ExpensesScreen = () => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.expenses.getAll();
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      Alert.alert(t('error'), t('error_load_expenses'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert(t('error'), t('error_fill_all_fields'));
      return;
    }

    try {
      const data = {
        name: name.trim(),
        amount: parseFloat(amount),
      };

      if (editingExpense) {
        await api.expenses.update(editingExpense.id, data);
      } else {
        await api.expenses.create(data);
      }

      setModalVisible(false);
      setName('');
      setAmount('');
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      Alert.alert(t('error'), t('error_save_expense'));
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setName(expense.name);
    setAmount(expense.amount.toString());
    setModalVisible(true);
  };

  const handleDelete = (expense) => {
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

  const handleCloseModal = () => {
    setModalVisible(false);
    setName('');
    setAmount('');
    setEditingExpense(null);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');

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
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <MaterialCommunityIcons name="delete" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyStateText}>{t('no_expenses')}</Text>
            <Text style={styles.emptyStateHint}>{t('expenses_hint')}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
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
                value={name}
                onChangeText={setName}
                placeholder={t('expense_rent')}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('amount')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    margin: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
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
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
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
