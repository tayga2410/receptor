import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { useDialog } from '../contexts/DialogContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { getCurrencySymbol } from '../utils/currency';
import { formatUnit } from '../utils/units';

const RecipeFormScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const dialog = useDialog();
  const user = useStore((state) => state.user);
  const recipe = route.params?.recipe;
  const [loading, setLoading] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(null); // Для редактирования
  const [tempSelectedIngredientId, setTempSelectedIngredientId] = useState(null); // Временное значение для Picker
  const scrollViewRef = useRef(null);
  const ingredientCardRefs = useRef([]);
  const scrollYRef = useRef(0);
  const screenHeight = Dimensions.get('window').height;

  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    description: recipe?.description || '',
    marginPercent: recipe?.marginPercent?.toString() || '100',
    ingredients: recipe?.ingredients?.map(ri => ({
      ingredientId: ri.ingredientId,
      quantity: ri.quantity.toString(),
      unitId: ri.unitId,
      ingredient: ri.ingredient,
      unit: ri.unit,
    })) || [],
  });

  useEffect(() => {
    loadIngredients();
    loadUnits();
  }, []);

  useEffect(() => {
    if (route.params?.showDeleteDialog && recipe) {
      dialog.confirm(
        t('delete'),
        t('confirm_delete_recipe'),
        {
          confirmText: t('delete'),
          cancelText: t('cancel'),
          destructive: true,
        }
      ).then((confirmed) => {
        if (confirmed) {
          handleDelete();
        }
      });
      navigation.setParams({ showDeleteDialog: undefined });
    }
  }, [route.params?.showDeleteDialog]);

  const loadIngredients = async () => {
    try {
      setIngredientsLoading(true);
      const response = await api.ingredients.getAll();
      const data = await response.json();
      setAvailableIngredients(data);

      // Синхронизируем единицы в ингредиентах рецепта с единицами ингредиентов
      // (если тип единицы изменился - например, кг -> л)
      if (recipe?.ingredients?.length > 0) {
        setFormData(prev => ({
          ...prev,
          ingredients: prev.ingredients.map(ri => {
            const updatedIngredient = data.find(i => i.id === ri.ingredientId);
            if (updatedIngredient && ri.unit?.type !== updatedIngredient.unit?.type) {
              // Тип единицы изменился - сбрасываем на единицу ингредиента
              return {
                ...ri,
                ingredient: updatedIngredient,
                unitId: updatedIngredient.unitId,
                unit: updatedIngredient.unit,
              };
            }
            // Обновляем данные ингредиента в любом случае
            if (updatedIngredient) {
              return { ...ri, ingredient: updatedIngredient };
            }
            return ri;
          }),
        }));
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      dialog.alert(t('error'), t('error_load_ingredients'));
    } finally {
      setIngredientsLoading(false);
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

  // Конвертация единиц: quantity в fromUnit -> количество в toUnit
  const convertUnits = (quantity, fromUnit, toUnit) => {
    if (!fromUnit || !toUnit) return quantity;
    const fromFactor = fromUnit.conversionFactor || 1;
    const toFactor = toUnit.conversionFactor || 1;
    const inBase = quantity * fromFactor;
    return inBase / toFactor;
  };

  // Получить единицы того же типа
  const getCompatibleUnits = (unitType) => {
    return allUnits.filter(u => u.type === unitType);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await api.recipes.delete(recipe.id);
      if (response.ok) {
        navigation.goBack();
      } else {
        const error = await response.json();
        dialog.alert(t('error'), error.message || t('error_delete_recipe'));
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      dialog.alert(t('error'), error.message || t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (availableIngredients.length === 0) {
      dialog.alert(t('error'), t('no_ingredients'));
      return;
    }
    setSelectedIngredientIndex(null); // null означает добавление нового
    setTempSelectedIngredientId(''); // Пустое значение - пользователь сам выберет
    setShowIngredientPicker(true);
  };

  const changeIngredient = (index) => {
    setSelectedIngredientIndex(index);
    setTempSelectedIngredientId(formData.ingredients[index]?.ingredientId || null);
    setShowIngredientPicker(true);
  };

  const confirmIngredientSelection = (ingredientId = null) => {
    const id = ingredientId || tempSelectedIngredientId;
    if (!id) {
      dialog.alert(t('error'), t('error_select_ingredient'));
      return;
    }

    const ingredient = availableIngredients.find(i => i.id === id);
    if (!ingredient) return;

    const newRecipeIngredient = {
      ingredientId: ingredient.id,
      quantity: '1',
      unitId: ingredient.unitId,
      ingredient: ingredient,
      unit: ingredient.unit,
    };

    if (selectedIngredientIndex === null) {
      // Добавление нового ингредиента
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, newRecipeIngredient],
      });
    } else {
      // Изменение существующего ингредиента - сохраняем количество
      const newIngredients = [...formData.ingredients];
      newIngredients[selectedIngredientIndex] = {
        ...newIngredients[selectedIngredientIndex],
        ingredientId: ingredient.id,
        ingredient: ingredient,
        unitId: ingredient.unitId,
        unit: ingredient.unit,
      };
      setFormData({ ...formData, ingredients: newIngredients });
    }

    setShowIngredientPicker(false);
    setSelectedIngredientIndex(null);
    setTempSelectedIngredientId(null);
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      ingredients: newIngredients,
    });
  };

  const updateIngredientQuantity = (index, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index].quantity = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredientUnit = (index, unitId) => {
    const newIngredients = [...formData.ingredients];
    const newUnit = allUnits.find(u => u.id === unitId);

    if (newUnit) {
      newIngredients[index].unitId = unitId;
      newIngredients[index].unit = newUnit;
      setFormData({ ...formData, ingredients: newIngredients });
    }
  };

  const calculateCostPrice = () => {
    return formData.ingredients.reduce((total, ri) => {
      const ingredientPrice = ri.ingredient?.pricePerUnit || 0;
      const quantity = parseFloat(ri.quantity) || 0;
      // Конвертация: количество в единице рецепта -> количество в единице ингредиента
      const convertedQty = convertUnits(quantity, ri.unit, ri.ingredient?.unit);
      return total + (ingredientPrice * convertedQty);
    }, 0);
  };

  // Расчёт стоимости одного ингредиента с конвертацией
  const calculateIngredientCost = (ri) => {
    const ingredientPrice = ri.ingredient?.pricePerUnit || 0;
    const quantity = parseFloat(ri.quantity) || 0;
    const convertedQty = convertUnits(quantity, ri.unit, ri.ingredient?.unit);
    return ingredientPrice * convertedQty;
  };

  const calculateSalePrice = () => {
    const costPrice = calculateCostPrice();
    const marginPercent = parseFloat(formData.marginPercent) || 0;
    return costPrice * (1 + marginPercent / 100);
  };

  const calculateProfit = () => {
    const costPrice = calculateCostPrice();
    const salePrice = calculateSalePrice();
    return salePrice - costPrice;
  };

  const handleSave = async () => {
    if (!formData.name || formData.ingredients.length === 0) {
      dialog.alert(t('error'), t('error_fill_required_fields'));
      return;
    }

    try {
      setLoading(true);

      const payloadIngredients = formData.ingredients.map(ri => ({
        ingredientId: ri.ingredientId,
        quantity: parseFloat(ri.quantity),
        unitId: ri.unitId,
      }));

      const costPrice = calculateCostPrice();
      const salePrice = calculateSalePrice();

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        portions: 1,
        salePrice: salePrice,
        currency: user?.currency || 'KZT',
        marginPercent: parseFloat(formData.marginPercent) || 0,
        ingredients: payloadIngredients,
      };

      let response;
      if (recipe?.id) {
        response = await api.recipes.update(recipe.id, payload);
      } else {
        response = await api.recipes.create(payload);
      }

      const responseData = await response.json();

      if (response.ok) {
        navigation.goBack();
      } else {
        dialog.alert(t('error'), responseData.message || t('error_save_recipe'));
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
      dialog.alert(t('error'), error.message || t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  const costPrice = calculateCostPrice();
  const salePrice = calculateSalePrice();
  const profit = calculateProfit();
  const currencySymbol = getCurrencySymbol(user?.currency || 'KZT');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.form}>
          {/* Название рецепта */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recipe_name')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder={t('recipe_name')}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Описание */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder={t('description')}
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Ингредиенты */}
          <View style={styles.ingredientsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('ingredients')} *</Text>
              <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {ingredientsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            ) : availableIngredients.length === 0 ? (
              <Text style={styles.emptyText}>
                {t('no_ingredients')}. {t('add_first_ingredient')}
              </Text>
            ) : formData.ingredients.length === 0 ? (
              <Text style={styles.emptyText}>
                {t('select_ingredient_hint')}
              </Text>
            ) : (
              formData.ingredients.map((ri, index) => (
                <View
                  key={index}
                  ref={el => ingredientCardRefs.current[index] = el}
                  style={styles.ingredientCard}
                >
                  <View style={styles.ingredientRow}>
                    <TouchableOpacity
                      style={styles.ingredientInfo}
                      onPress={() => changeIngredient(index)}
                    >
                      <Text style={styles.ingredientName}>{ri.ingredient?.name}</Text>
                      <Text style={styles.ingredientPrice}>
                        {ri.ingredient?.pricePerUnit} {currencySymbol}/{formatUnit(ri.ingredient?.unit?.name, ri.ingredient?.unit?.shortName, language)}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.ingredientActions}>
                      <TouchableOpacity
                        style={styles.changeButton}
                        onPress={() => changeIngredient(index)}
                      >
                        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeIngredientButton}
                        onPress={() => removeIngredient(index)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.quantitySection}>
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>{t('qty_short')}</Text>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const currentQty = parseFloat(ri.quantity) || 0;
                            const newQty = Math.max(0, currentQty - 0.5).toString();
                            updateIngredientQuantity(index, newQty);
                          }}
                        >
                          <MaterialCommunityIcons name="minus" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.quantityInput}
                          value={ri.quantity}
                          onChangeText={(value) => updateIngredientQuantity(index, value)}
                          keyboardType="decimal-pad"
                          onFocus={() => {
                            const cardRef = ingredientCardRefs.current[index];
                            if (cardRef && cardRef.measureInWindow && scrollViewRef.current) {
                              cardRef.measureInWindow((_x, y, _width, _height) => {
                                const targetY = screenHeight / 3;
                                const scrollOffset = y - targetY;
                                const newScrollY = scrollYRef.current + scrollOffset;

                                if (scrollOffset > 0) {
                                  scrollViewRef.current.scrollTo({
                                    y: newScrollY,
                                    animated: true,
                                  });
                                }
                              });
                            }
                          }}
                        />
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const currentQty = parseFloat(ri.quantity) || 0;
                            const newQty = (currentQty + 0.5).toString();
                            updateIngredientQuantity(index, newQty);
                          }}
                        >
                          <MaterialCommunityIcons name="plus" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                      </View>
                      {/* Кубики единиц на той же строке */}
                      <View style={styles.unitSelectorRow}>
                        {getCompatibleUnits(ri.ingredient?.unit?.type).map(unit => (
                          <TouchableOpacity
                            key={unit.id}
                            style={[
                              styles.unitChip,
                              ri.unitId === unit.id && styles.unitChipSelected,
                            ]}
                            onPress={() => updateIngredientUnit(index, unit.id)}
                          >
                            <Text style={[
                              styles.unitChipText,
                              ri.unitId === unit.id && styles.unitChipTextSelected,
                            ]}>
                              {formatUnit(unit.name, unit.shortName, language)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    {/* Формула расчёта */}
                    <Text style={styles.costLabel}>
                      {ri.quantity} {formatUnit(ri.unit?.name, ri.unit?.shortName, language)} × {ri.ingredient?.pricePerUnit} {currencySymbol}/{formatUnit(ri.ingredient?.unit?.name, ri.ingredient?.unit?.shortName, language)} = {calculateIngredientCost(ri).toFixed(2)} {currencySymbol}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Модальное окно выбора ингредиента */}
          <Modal
            visible={showIngredientPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowIngredientPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedIngredientIndex === null ? t('add_ingredient') : t('edit')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowIngredientPicker(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={availableIngredients}
                  keyExtractor={(item) => item.id}
                  style={styles.ingredientsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.ingredientListItem}
                      onPress={() => confirmIngredientSelection(item.id)}
                    >
                      <Text style={styles.ingredientListItemName}>{item.name}</Text>
                      <Text style={styles.ingredientListItemPrice}>
                        {item.pricePerUnit} {currencySymbol}/{formatUnit(item.unit?.name, item.unit?.shortName, language)}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>{t('no_ingredients')}</Text>
                  }
                />
              </View>
            </View>
          </Modal>

          {/* Финансовая сводка */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>{t('cost_price')}:</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>{costPrice.toFixed(2)} {currencySymbol}</Text>
            </View>

            <Text style={styles.summaryTitle}>{t('margin')} (%):</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                value={formData.marginPercent}
                onChangeText={(text) => setFormData({ ...formData, marginPercent: text })}
                placeholder="100"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceInputLabel}>%</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t('sale_price')}:</Text>
              <Text style={styles.resultValue}>{salePrice.toFixed(2)} {currencySymbol}</Text>
            </View>

            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>{t('profit')}:</Text>
              <Text style={[styles.profitValue, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                {profit.toFixed(2)} {currencySymbol}
              </Text>
            </View>
          </View>

          {/* Кнопки */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          {recipe && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => navigation.setParams({ showDeleteDialog: true })}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>{t('delete')}</Text>
            </TouchableOpacity>
          )}
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
  scrollContent: {
    flexGrow: 1,
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  form: {
    paddingTop: THEME.spacing.md,
  },
  inputContainer: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  ingredientsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: THEME.spacing.md,
  },
  ingredientCard: {
    backgroundColor: COLORS.background,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  ingredientInfo: {
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  changeButton: {
    padding: THEME.spacing.xs,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  ingredientPrice: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  removeIngredientButton: {
    padding: THEME.spacing.xs,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  quantitySection: {
    gap: THEME.spacing.xs,
  },
  quantityLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
  },
  quantityButton: {
    padding: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  quantityInput: {
    fontSize: 14,
    width: 50,
    textAlign: 'center',
    color: COLORS.text,
    paddingVertical: 2,
    paddingHorizontal: THEME.spacing.xs,
  },
  unitLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  unitSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  unitChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  unitChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  unitChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginTop: THEME.spacing.xs,
  },
  summarySection: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: THEME.spacing.xs,
  },
  summaryRow: {
    marginBottom: THEME.spacing.sm,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
  },
  priceInputLabel: {
    position: 'absolute',
    right: THEME.spacing.md,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: THEME.spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  resultLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: THEME.spacing.sm,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness * 2,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  ingredientsList: {
    maxHeight: 400,
  },
  ingredientListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingredientListItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  ingredientListItemPrice: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default RecipeFormScreen;
