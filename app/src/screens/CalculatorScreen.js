import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const CalculatorScreen = () => {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: 'kg',
    pricePerUnit: '',
    quantity: '',
  });

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.pricePerUnit && newIngredient.quantity) {
      setIngredients([
        ...ingredients,
        {
          id: Date.now().toString(),
          name: newIngredient.name,
          unit: newIngredient.unit,
          pricePerUnit: parseFloat(newIngredient.pricePerUnit),
          quantity: parseFloat(newIngredient.quantity),
        },
      ]);
      setNewIngredient({ name: '', unit: 'kg', pricePerUnit: '', quantity: '' });
    }
  };

  const calculateCostPrice = () => {
    return ingredients.reduce((total, item) => {
      return total + item.pricePerUnit * item.quantity;
    }, 0);
  };

  const costPrice = calculateCostPrice();
  const marginPercent = 100;
  const salePrice = costPrice * (1 + marginPercent / 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('calculator')}</Text>

        <View style={styles.resultContainer}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Себестоимость:</Text>
            <Text style={styles.resultValue}>{costPrice.toFixed(2)} ₸</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Маржа:</Text>
            <Text style={styles.resultValue}>{marginPercent}%</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Цена продажи:</Text>
            <Text style={styles.resultValue}>{salePrice.toFixed(2)} ₸</Text>
          </View>
        </View>

        <View style={styles.ingredientsList}>
          <Text style={styles.listTitle}>Ингредиенты:</Text>
          {ingredients.map((item) => (
            <View key={item.id} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>
                {item.name} - {item.quantity} {item.unit}
              </Text>
              <Text style={styles.ingredientCost}>
                {(item.pricePerUnit * item.quantity).toFixed(2)} ₸
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.addIngredientForm}>
          <Text style={styles.formTitle}>Добавить ингредиент:</Text>
          <TextInput
            style={styles.input}
            placeholder="Название"
            value={newIngredient.name}
            onChangeText={(text) => setNewIngredient({ ...newIngredient, name: text })}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Цена за единицу"
              value={newIngredient.pricePerUnit}
              onChangeText={(text) => setNewIngredient({ ...newIngredient, pricePerUnit: text })}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Количество"
              value={newIngredient.quantity}
              onChangeText={(text) => setNewIngredient({ ...newIngredient, quantity: text })}
              keyboardType="decimal-pad"
            />
          </View>
          <Pressable style={styles.addButton} onPress={addIngredient}>
            <Text style={styles.addButtonText}>Добавить</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: THEME.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.lg,
  },
  resultContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  resultLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ingredientsList: {
    marginBottom: THEME.spacing.lg,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.roundness,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ingredientName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  ingredientCost: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  addIngredientForm: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 16,
    marginBottom: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.roundness,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default CalculatorScreen;
