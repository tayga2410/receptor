import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';
import useStore from '../store/useStore';

const RecipesScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecipes();

    const unsubscribe = navigation.addListener('focus', () => {
      loadRecipes();
    });

    return unsubscribe;
  }, [navigation]);

  const loadRecipes = async () => {
    try {
      const response = await api.recipes.getAll();
      const data = await response.json();
      // Бэкенд возвращает { recipes: [], total, ... }
      setRecipes(Array.isArray(data) ? data : (data.recipes || []));
    } catch (error) {
      console.error('Failed to load recipes:', error);
      Alert.alert('Error', error.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const handleAddRecipe = () => {
    navigation.navigate('RecipeForm');
  };

  const handleRecipePress = (recipe) => {
    navigation.navigate('RecipeForm', { recipe });
  };

  const handleDeleteRecipe = (recipe) => {
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
              const response = await api.recipes.delete(recipe.id);
              if (response.ok) {
                loadRecipes();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to delete recipe');
              }
            } catch (error) {
              console.error('Failed to delete recipe:', error);
              Alert.alert('Error', error.message || 'Network error');
            }
          },
        },
      ]
    );
  };

  // Конвертация единиц: quantity в fromUnit -> количество в toUnit
  const convertUnits = (quantity, fromUnit, toUnit) => {
    if (!fromUnit || !toUnit) return quantity;
    const fromFactor = fromUnit.conversionFactor || 1;
    const toFactor = toUnit.conversionFactor || 1;
    const inBase = quantity * fromFactor;
    return inBase / toFactor;
  };

  const calculateCostPrice = (recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
    return recipe.ingredients.reduce((total, ri) => {
      const ingredientPrice = ri.ingredient?.pricePerUnit || 0;
      const quantity = parseFloat(ri.quantity) || 0;
      // Конвертация: количество в единице рецепта -> количество в единице ингредиента
      const convertedQty = convertUnits(quantity, ri.unit, ri.ingredient?.unit);
      return total + (ingredientPrice * convertedQty);
    }, 0);
  };

  const calculateSalePrice = (recipe) => {
    const costPrice = calculateCostPrice(recipe);
    const marginPercent = recipe.marginPercent || 0;
    return costPrice * (1 + marginPercent / 100);
  };

  const calculateProfit = (recipe) => {
    const costPrice = calculateCostPrice(recipe);
    const salePrice = calculateSalePrice(recipe);
    return salePrice - costPrice;
  };

  const renderRecipe = ({ item }) => {
    const costPrice = calculateCostPrice(item);
    const salePrice = calculateSalePrice(item);
    const profit = calculateProfit(item);
    const userCurrency = user?.currency || 'KZT';
    const currencySymbol = getCurrencySymbol(userCurrency);

    return (
      <Pressable
        style={styles.recipeCard}
        onPress={() => handleRecipePress(item)}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeName}>{item.name || t('unnamed_recipe')}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRecipe(item)}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.recipeStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('cost_price')}:</Text>
            <Text style={styles.statValue}>{costPrice.toFixed(2)} {currencySymbol}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('sale_price')}:</Text>
            <Text style={styles.statValue}>{salePrice.toFixed(2)} {currencySymbol}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('profit')}:</Text>
            <Text style={[styles.statValue, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
              {profit.toFixed(2)} {currencySymbol}
            </Text>
          </View>
        </View>

        {item.ingredients && item.ingredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsTitle}>{t('ingredients')} ({item.ingredients.length}):</Text>
            <Text style={styles.ingredientsPreview}>
              {item.ingredients.map(ri => ri.ingredient?.name).join(', ')}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="silverware-fork-knife" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyStateText}>{t('no_recipes')}</Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={handleAddRecipe}>
        <Text style={styles.addFirstButtonText}>{t('add_first_recipe')}</Text>
      </TouchableOpacity>
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
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {recipes.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddRecipe}>
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  deleteButton: {
    padding: THEME.spacing.xs,
  },
  recipeStats: {
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  ingredientsContainer: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ingredientsTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: THEME.spacing.xs,
  },
  ingredientsPreview: {
    fontSize: 13,
    color: COLORS.text,
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
  },
  addFirstButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness * 2,
    marginTop: THEME.spacing.lg,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecipesScreen;
