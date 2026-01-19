import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, Pressable } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const mockIngredients = [
  {
    id: '1',
    name: 'Сахар',
    unit: 'kg',
    pricePerUnit: 600,
    currency: 'KZT',
  },
  {
    id: '2',
    name: 'Мука',
    unit: 'kg',
    pricePerUnit: 350,
    currency: 'KZT',
  },
  {
    id: '3',
    name: 'Масло растительное',
    unit: 'l',
    pricePerUnit: 1200,
    currency: 'KZT',
  },
];

const IngredientsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState(mockIngredients);

  const renderIngredient = ({ item }) => (
    <Pressable
      style={styles.ingredientCard}
      onPress={() => console.log('Ingredient details:', item.id)}
    >
      <View style={styles.ingredientHeader}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <Text style={styles.ingredientPrice}>
          {item.pricePerUnit} {item.currency}/{item.unit}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={ingredients}
        renderItem={renderIngredient}
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
  ingredientCard: {
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
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  ingredientPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default IngredientsScreen;
