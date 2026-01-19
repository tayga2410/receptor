import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, Pressable } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const mockRecipes = [
  {
    id: '1',
    name: 'Борщ',
    portions: 4,
    costPrice: 1200,
    salePrice: 2500,
    marginPercent: 108.33,
    profit: 1300,
  },
  {
    id: '2',
    name: 'Плов',
    portions: 6,
    costPrice: 1800,
    salePrice: 4000,
    marginPercent: 122.22,
    profit: 2200,
  },
  {
    id: '3',
    name: 'Салат Цезарь',
    portions: 2,
    costPrice: 800,
    salePrice: 1800,
    marginPercent: 125,
    profit: 1000,
  },
];

const RecipesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState(mockRecipes);

  const renderRecipe = ({ item }) => (
    <Pressable
      style={styles.recipeCard}
      onPress={() => console.log('Recipe details:', item.id)}
    >
      <Text style={styles.recipeName}>{item.name}</Text>
      <View style={styles.recipeStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Себестоимость:</Text>
          <Text style={styles.statValue}>{item.costPrice} ₸</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Цена продажи:</Text>
          <Text style={styles.statValue}>{item.salePrice} ₸</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Маржа:</Text>
          <Text style={styles.statValue}>{item.marginPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Прибыль:</Text>
          <Text style={styles.statValue}>{item.profit} ₸</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
});

export default RecipesScreen;
