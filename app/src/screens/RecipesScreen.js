import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const RecipesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузка данных с API
    setLoading(false);
  }, []);

  const renderRecipe = ({ item }) => (
    <Pressable
      style={styles.recipeCard}
      onPress={() => console.log('Recipe details:', item.id)}
    >
      <Text style={styles.recipeName}>{item.name}</Text>
      <View style={styles.recipeStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('cost_price')}:</Text>
          <Text style={styles.statValue}>{item.costPrice} ₸</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('sale_price')}:</Text>
          <Text style={styles.statValue}>{item.salePrice} ₸</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('margin')}:</Text>
          <Text style={styles.statValue}>{item.marginPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('profit')}:</Text>
          <Text style={styles.statValue}>{item.profit} ₸</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{t('no_recipes')}</Text>
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
      />
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
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  recipeStats: {
    gap: THEME.spacing.xs,
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecipesScreen;
