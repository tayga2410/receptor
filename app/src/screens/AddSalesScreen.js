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
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';
import { formatUnit } from '../utils/units';
import useStore from '../store/useStore';

const AddSalesScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');
  const { date } = route.params || {};

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expense items state
  const [expenseItems, setExpenseItems] = useState([]);
  const [selectedExpenseItems, setSelectedExpenseItems] = useState({});
  const [selectedExpenseUnits, setSelectedExpenseUnits] = useState({}); // unitId для каждого expense item
  const [allUnits, setAllUnits] = useState([]);

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState('0');

  useEffect(() => {
    loadRecipes();
    loadExpenseItems();
    loadUnits();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await api.recipes.getAll();
      const data = await response.json();
      const recipesList = Array.isArray(data) ? data : (data.recipes || []);
      setRecipes(recipesList);

      const initialQuantities = {};
      recipesList.forEach(recipe => {
        initialQuantities[recipe.id] = '0';
      });
      setSelectedRecipes(initialQuantities);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      Alert.alert(t('error'), t('error_load_recipes'));
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseItems = async () => {
    try {
      const response = await api.expenseItems.getAll();
      const data = await response.json();
      setExpenseItems(data);

      const initialQuantities = {};
      const initialUnits = {};
      data.forEach(item => {
        initialQuantities[item.id] = '0';
        initialUnits[item.id] = item.unitId; // По умолчанию - единица из expense item
      });
      setSelectedExpenseItems(initialQuantities);
      setSelectedExpenseUnits(initialUnits);
    } catch (error) {
      console.error('Failed to load expense items:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await api.units.getAll();
      const data = await response.json();
      setAllUnits(data);
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  // Конвертация единиц
  const convertUnits = (quantity, fromUnit, toUnit) => {
    if (!fromUnit || !toUnit) return quantity;
    const fromFactor = fromUnit.conversionFactor || 1;
    const toFactor = toUnit.conversionFactor || 1;
    const inBase = quantity * fromFactor;
    return inBase / toFactor;
  };

  // Расчёт себестоимости рецепта с конвертацией единиц
  const calculateCostPrice = (recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
    return recipe.ingredients.reduce((total, ri) => {
      const ingredientPrice = ri.ingredient?.pricePerUnit || 0;
      const quantity = parseFloat(ri.quantity) || 0;
      const convertedQty = convertUnits(quantity, ri.unit, ri.ingredient?.unit);
      return total + (ingredientPrice * convertedQty);
    }, 0);
  };

  // Расчёт цены продажи на основе себестоимости и маржи
  const calculateSalePrice = (recipe) => {
    const costPrice = calculateCostPrice(recipe);
    const marginPercent = recipe.marginPercent || 0;
    return costPrice * (1 + marginPercent / 100);
  };

  // Получить единицы того же типа
  const getCompatibleUnits = (unitType) => {
    return allUnits.filter(u => u.type === unitType);
  };

  const updateQuantity = (recipeId, quantity) => {
    setSelectedRecipes(prev => ({
      ...prev,
      [recipeId]: quantity,
    }));
  };

  const updateExpenseItemQuantity = (itemId, quantity) => {
    setSelectedExpenseItems(prev => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const updateExpenseItemUnit = (itemId, unitId) => {
    setSelectedExpenseUnits(prev => ({
      ...prev,
      [itemId]: unitId,
    }));
  };

  // Расчёт стоимости expense item с конвертацией
  const calculateExpenseItemCost = (item) => {
    const quantity = parseFloat(selectedExpenseItems[item.id]) || 0;
    const selectedUnit = allUnits.find(u => u.id === selectedExpenseUnits[item.id]);
    const baseUnit = item.unit;

    if (selectedUnit && baseUnit && selectedUnit.id !== baseUnit.id) {
      const convertedQty = convertUnits(quantity, selectedUnit, baseUnit);
      return convertedQty * item.pricePerUnit;
    }
    return quantity * item.pricePerUnit;
  };

  const handleSubmit = async () => {
    const items = [];

    for (const [recipeId, quantity] of Object.entries(selectedRecipes)) {
      const qty = parseFloat(quantity);
      if (qty > 0) {
        items.push({ recipeId, quantity: qty });
      }
    }

    if (items.length === 0) {
      Alert.alert(t('error'), t('select_recipes'));
      return;
    }

    // Build expense items array
    const expenseItemsData = [];
    for (const [itemId, quantity] of Object.entries(selectedExpenseItems)) {
      const qty = parseFloat(quantity);
      if (qty > 0) {
        expenseItemsData.push({
          expenseItemId: itemId,
          quantity: qty,
          unitId: selectedExpenseUnits[itemId], // Отправляем выбранную единицу
        });
      }
    }

    try {
      setSubmitting(true);
      const salesData = {
        date: date ? new Date(date) : new Date(),
        items,
        expenseItems: expenseItemsData.length > 0 ? expenseItemsData : undefined,
        deliveryFee: parseFloat(deliveryFee) || 0,
      };

      const response = await api.sales.create(salesData);

      if (response.ok) {
        Alert.alert(
          t('success'),
          t('sale_created'),
          [
            {
              text: t('ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert(t('error'), error.message || t('error_create_sale'));
      }
    } catch (error) {
      console.error('Failed to create sale:', error);
      Alert.alert(t('error'), t('error_create_sale'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecipe = ({ item }) => {
    const itemCurrencySymbol = getCurrencySymbol(item.currency);
    const salePrice = calculateSalePrice(item);
    const quantity = parseFloat(selectedRecipes[item.id]) || 0;
    const totalPrice = quantity * salePrice;

    return (
      <View style={styles.recipeCard}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeName}>{item.name || t('unnamed_recipe')}</Text>
          <View style={styles.recipePriceContainer}>
            <Text style={styles.recipePrice}>
              {totalPrice.toFixed(2)} {itemCurrencySymbol}
            </Text>
            <Text style={styles.recipePricePerUnit}>
              {salePrice.toFixed(2)} {itemCurrencySymbol} / {t('pcs')}
            </Text>
          </View>
        </View>

        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>{t('quantity')}:</Text>
          <View style={styles.quantityInputWrapper}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const current = parseFloat(selectedRecipes[item.id]) || 0;
                updateQuantity(item.id, Math.max(0, current - 1).toString());
              }}
            >
              <MaterialCommunityIcons name="minus" size={20} color={COLORS.accent} />
            </TouchableOpacity>

            <TextInput
              style={styles.quantityInput}
              value={selectedRecipes[item.id]}
              onChangeText={(text) => updateQuantity(item.id, text)}
              keyboardType="decimal-pad"
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const current = parseFloat(selectedRecipes[item.id]) || 0;
                updateQuantity(item.id, (current + 1).toString());
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderExpenseItem = ({ item }) => {
    const quantity = parseFloat(selectedExpenseItems[item.id]) || 0;
    const totalPrice = calculateExpenseItemCost(item);
    const selectedUnit = allUnits.find(u => u.id === selectedExpenseUnits[item.id]);
    const compatibleUnits = getCompatibleUnits(item.unit?.type);

    return (
      <View style={styles.expenseItemCard}>
        <View style={styles.expenseItemHeader}>
          <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.error} />
          <View style={styles.expenseItemInfo}>
            <Text style={styles.expenseItemName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.expenseItemDescription}>{item.description}</Text>
            )}
          </View>
          <Text style={styles.expenseItemPrice}>
            {totalPrice.toFixed(2)} {currencySymbol}
          </Text>
        </View>

        <View style={styles.quantityRow}>
          <Text style={styles.expenseItemUnit}>
            {item.pricePerUnit.toFixed(2)} {currencySymbol}/{formatUnit(item.unit?.name, item.unit?.shortName, language)}
          </Text>

          <View style={styles.expenseItemControls}>
            {/* Выбор единицы */}
            {compatibleUnits.length > 1 && (
              <View style={styles.unitSelector}>
                {compatibleUnits.map(unit => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitOption,
                      selectedExpenseUnits[item.id] === unit.id && styles.unitOptionSelected,
                    ]}
                    onPress={() => updateExpenseItemUnit(item.id, unit.id)}
                  >
                    <Text style={[
                      styles.unitOptionText,
                      selectedExpenseUnits[item.id] === unit.id && styles.unitOptionTextSelected,
                    ]}>
                      {formatUnit(unit.name, unit.shortName, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Ввод количества */}
            <View style={styles.quantityInputWrapper}>
              <TouchableOpacity
                style={styles.quantityButtonSmall}
                onPress={() => {
                  const current = parseFloat(selectedExpenseItems[item.id]) || 0;
                  updateExpenseItemQuantity(item.id, Math.max(0, current - 0.5).toString());
                }}
              >
                <MaterialCommunityIcons name="minus" size={16} color={COLORS.accent} />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInputSmall}
                value={selectedExpenseItems[item.id]}
                onChangeText={(text) => updateExpenseItemQuantity(item.id, text)}
                keyboardType="decimal-pad"
                textAlign="center"
              />

              <TouchableOpacity
                style={styles.quantityButtonSmall}
                onPress={() => {
                  const current = parseFloat(selectedExpenseItems[item.id]) || 0;
                  updateExpenseItemQuantity(item.id, (current + 0.5).toString());
                }}
              >
                <MaterialCommunityIcons name="plus" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  const selectedCount = Object.values(selectedRecipes).filter(q => parseFloat(q) > 0).length;
  const selectedExpenseTotal = expenseItems.reduce((sum, item) => {
    return sum + calculateExpenseItemCost(item);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.textLight} />
        <Text style={styles.headerText}>{t('snapshots_info')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Recipes section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('select_recipes')}</Text>
          {recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('no_recipes')}</Text>
            </View>
          ) : (
            recipes.map(item => (
              <View key={item.id}>
                {renderRecipe({ item })}
              </View>
            ))
          )}
        </View>

        {/* Expense items section */}
        {expenseItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.error} />
              <Text style={styles.sectionTitle}>{t('expense_items')}</Text>
            </View>
            {expenseItems.map(item => (
              <View key={item.id}>
                {renderExpenseItem({ item })}
              </View>
            ))}
            {selectedExpenseTotal > 0 && (
              <View style={styles.expenseTotal}>
                <Text style={styles.expenseTotalLabel}>{t('total')}:</Text>
                <Text style={styles.expenseTotalAmount}>
                  {selectedExpenseTotal.toFixed(2)} {currencySymbol}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delivery section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>{t('delivery')}</Text>
          </View>
          <View style={styles.deliveryCard}>
            <Text style={styles.deliveryLabel}>{t('delivery_fee')}</Text>
            <View style={styles.deliveryInputRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const current = parseFloat(deliveryFee) || 0;
                  setDeliveryFee(Math.max(0, current - 100).toString());
                }}
              >
                <MaterialCommunityIcons name="minus" size={20} color={COLORS.accent} />
              </TouchableOpacity>

              <TextInput
                style={styles.deliveryInput}
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="decimal-pad"
                textAlign="center"
              />

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const current = parseFloat(deliveryFee) || 0;
                  setDeliveryFee((current + 100).toString());
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={COLORS.accent} />
              </TouchableOpacity>

              <Text style={styles.currencyText}>{currencySymbol}</Text>
            </View>
            <Text style={styles.deliveryHint}>{t('delivery_hint')}</Text>
          </View>
        </View>
      </ScrollView>

      {recipes.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedCount} {t('recipes_selected')}
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, selectedCount === 0 && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || selectedCount === 0}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>{t('save')}</Text>
              </>
            )}
          </TouchableOpacity>
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
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: 13,
    color: COLORS.textLight,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  recipeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  recipePriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  recipePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  recipePricePerUnit: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  quantityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: THEME.roundness,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 60,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.sm,
  },
  // Expense item styles
  expenseItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  expenseItemInfo: {
    flex: 1,
  },
  expenseItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  expenseItemDescription: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expenseItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  expenseItemUnit: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  expenseItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  unitOption: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
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
    fontSize: 12,
    color: COLORS.text,
  },
  unitOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  quantityButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: THEME.roundness,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInputSmall: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.xs,
    textAlign: 'center',
  },
  expenseTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  expenseTotalLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  expenseTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  // Delivery styles
  deliveryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  deliveryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  deliveryInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.sm,
    textAlign: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    minWidth: 30,
  },
  deliveryHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: THEME.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedCount: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: COLORS.accent,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness * 2,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddSalesScreen;
