import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
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

const EditSalesScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');
  const { orderId, date } = route.params;

  const [order, setOrder] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expense items state
  const [expenseItems, setExpenseItems] = useState([]);
  const [selectedExpenseItems, setSelectedExpenseItems] = useState({});
  const [selectedExpenseUnits, setSelectedExpenseUnits] = useState({});
  const [allUnits, setAllUnits] = useState([]);

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState('0');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load order, recipes, expense items and units in parallel
      const [orderRes, recipesRes, expenseItemsRes, unitsRes] = await Promise.all([
        api.sales.getOne(orderId),
        api.recipes.getAll(),
        api.expenseItems.getAll(),
        api.units.getAll(),
      ]);

      const orderData = await orderRes.json();
      const recipesData = await recipesRes.json();
      const expenseItemsData = await expenseItemsRes.json();
      const unitsData = await unitsRes.json();

      setOrder(orderData);
      setRecipes(Array.isArray(recipesData) ? recipesData : (recipesData.recipes || []));
      setExpenseItems(expenseItemsData);
      setAllUnits(unitsData);

      // Initialize selected recipes from order items
      const recipeQuantities = {};
      orderData.items?.forEach(item => {
        recipeQuantities[item.recipeId] = item.quantity.toString();
      });
      setSelectedRecipes(recipeQuantities);

      // Initialize expense items from order
      const expenseQuantities = {};
      const expenseUnits = {};
      orderData.expenseItems?.forEach(item => {
        expenseQuantities[item.expenseItemId] = item.quantity.toString();
        expenseUnits[item.expenseItemId] = item.unitId;
      });
      setSelectedExpenseItems(expenseQuantities);
      setSelectedExpenseUnits(expenseUnits);

      // Initialize delivery fee
      setDeliveryFee((orderData.deliveryFee || 0).toString());

    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert(t('error'), t('error_load_sales'));
    } finally {
      setLoading(false);
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

  // Расчёт себестоимости рецепта
  const calculateCostPrice = (recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
    return recipe.ingredients.reduce((total, ri) => {
      const ingredientPrice = ri.ingredient?.pricePerUnit || 0;
      const quantity = parseFloat(ri.quantity) || 0;
      const convertedQty = convertUnits(quantity, ri.unit, ri.ingredient?.unit);
      return total + (ingredientPrice * convertedQty);
    }, 0);
  };

  // Расчёт цены продажи
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

  // Расчёт стоимости expense item
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

  const handleUpdate = async () => {
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
          unitId: selectedExpenseUnits[itemId],
        });
      }
    }

    try {
      setSubmitting(true);
      const updateData = {
        items,
        expenseItems: expenseItemsData.length > 0 ? expenseItemsData : undefined,
        deliveryFee: parseFloat(deliveryFee) || 0,
      };

      const response = await api.sales.update(orderId, updateData);

      if (response.ok) {
        Alert.alert(
          t('success'),
          t('sale_updated'),
          [
            {
              text: t('ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert(t('error'), error.message || t('error_update_sale'));
      }
    } catch (error) {
      console.error('Failed to update sale:', error);
      Alert.alert(t('error'), t('error_update_sale'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
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
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_sale'));
            }
          },
        },
      ]
    );
  };

  const renderRecipe = (item) => {
    const itemCurrencySymbol = getCurrencySymbol(item.currency);
    const salePrice = calculateSalePrice(item);
    const quantity = parseFloat(selectedRecipes[item.id]) || 0;
    const totalPrice = quantity * salePrice;

    return (
      <View key={item.id} style={styles.recipeCard}>
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
              value={selectedRecipes[item.id] || '0'}
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

  const renderExpenseItem = (item) => {
    const quantity = parseFloat(selectedExpenseItems[item.id]) || 0;
    const totalPrice = calculateExpenseItemCost(item);
    const selectedUnit = allUnits.find(u => u.id === selectedExpenseUnits[item.id]);
    const compatibleUnits = getCompatibleUnits(item.unit?.type);

    return (
      <View key={item.id} style={styles.expenseItemCard}>
        <View style={styles.expenseItemHeader}>
          <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.error} />
          <View style={styles.expenseItemInfo}>
            <Text style={styles.expenseItemName}>{item.name}</Text>
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
                value={selectedExpenseItems[item.id] || '0'}
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Recipes section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('select_recipes')}</Text>
          {recipes.map(item => renderRecipe(item))}
        </View>

        {/* Expense items section */}
        {expenseItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.error} />
              <Text style={styles.sectionTitle}>{t('expense_items')}</Text>
            </View>
            {expenseItems.map(item => renderExpenseItem(item))}
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
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>{t('delete')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, selectedCount === 0 && styles.submitButtonDisabled]}
          onPress={handleUpdate}
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness * 2,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

export default EditSalesScreen;
