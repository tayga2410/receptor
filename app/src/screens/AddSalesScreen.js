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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';

const AddSalesScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { date } = route.params || {};
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecipes();
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

  const updateQuantity = (recipeId, quantity) => {
    setSelectedRecipes(prev => ({
      ...prev,
      [recipeId]: quantity,
    }));
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

    try {
      setSubmitting(true);
      const salesData = {
        date: date ? new Date(date) : new Date(),
        items,
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
    const profitPerPortion = item.salePrice - (item.costPrice || 0);
    const currencySymbol = getCurrencySymbol(item.currency);

    return (
      <View style={styles.recipeCard}>
        <View style={styles.recipeHeader}>
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeName}>{item.name || t('unnamed_recipe')}</Text>
            <Text style={styles.recipePrice}>
              {item.salePrice.toFixed(2)} {currencySymbol}
            </Text>
          </View>
        </View>

        <View style={styles.recipeDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.detailText}>
              {t('cost_price')}: {(item.costPrice || 0).toFixed(2)} {currencySymbol}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name={profitPerPortion >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color={profitPerPortion >= 0 ? COLORS.success : COLORS.error}
            />
            <Text style={[
              styles.detailText,
              profitPerPortion >= 0 ? styles.profitPositive : styles.profitNegative
            ]}>
              {t('profit')}: {profitPerPortion.toFixed(2)} {currencySymbol}
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
      <View style={styles.header}>
        <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.textLight} />
        <Text style={styles.headerText}>{t('snapshots_info')}</Text>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('no_recipes')}</Text>
          </View>
        }
      />

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
  listContent: {
    padding: THEME.spacing.md,
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
    marginBottom: THEME.spacing.sm,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  recipeDetails: {
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
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
