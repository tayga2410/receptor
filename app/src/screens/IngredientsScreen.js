import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Pressable, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { formatPricePerUnit } from '../utils/currency';
import useStore from '../store/useStore';
import { CURRENCIES } from '../utils/currency';

const IngredientsScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('name_asc');

  const handleSortByName = () => {
    const newType = sortType === 'name_asc' ? 'name_desc' : 'name_asc';
    setSortType(newType);
    setFilteredIngredients(applySort(filteredIngredients));
  };

  const handleSortByPrice = () => {
    const newType = sortType === 'price_asc' ? 'price_desc' : 'price_asc';
    setSortType(newType);
    setFilteredIngredients(applySort(filteredIngredients));
  };

  useEffect(() => {
    loadIngredients();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadIngredients();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let data = ingredients;
    if (searchQuery.trim() !== '') {
      data = ingredients.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredIngredients(applySort(data));
  }, [searchQuery, ingredients, sortType]);

  const applySort = (data) => {
    const sorted = [...data];
    switch (sortType) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
    }
    return sorted;
  };

  const loadIngredients = async () => {
    try {
      const response = await api.ingredients.getAll();
      const data = await response.json();
      const sortedData = applySort(data);
      setIngredients(sortedData);
      setFilteredIngredients(sortedData);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      Alert.alert('Error', error.message || 'Failed to load ingredients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadIngredients();
  };

  const handleAddIngredient = () => {
    navigation.navigate('IngredientForm');
  };

  const handleIngredientPress = (ingredient) => {
    navigation.navigate('IngredientForm', { ingredient });
  };

  const renderIngredient = ({ item }) => {
    const userCurrency = user?.currency || 'KZT';
    return (
      <Pressable
        style={styles.ingredientCard}
        onPress={() => handleIngredientPress(item)}
      >
        <View style={styles.ingredientHeader}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <Text style={styles.ingredientPrice}>
            {formatPricePerUnit(item.pricePerUnit, userCurrency, item.unit, language)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="food-variant" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyStateText}>{t('no_ingredients')}</Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={handleAddIngredient}>
        <Text style={styles.addFirstButtonText}>{t('add_first_ingredient')}</Text>
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
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortType.includes('name') && styles.sortButtonActive]} 
            onPress={handleSortByName}
          >
            <MaterialCommunityIcons 
              name={sortType === 'name_asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={20} 
              color={sortType.includes('name') ? COLORS.accent : COLORS.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortType.includes('price') && styles.sortButtonActive]} 
            onPress={handleSortByPrice}
          >
            <MaterialCommunityIcons 
              name={sortType === 'price_asc' ? 'sort-numeric-ascending' : 'sort-numeric-descending'} 
              size={20} 
              color={sortType.includes('price') ? COLORS.accent : COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredIngredients}
        renderItem={renderIngredient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && filteredIngredients.length === 0 ? renderEmptyState : null}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {filteredIngredients.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddIngredient}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.roundness,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    color: COLORS.text,
  },
  sortButton: {
    padding: THEME.spacing.sm,
    marginLeft: THEME.spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: COLORS.accent + '20',
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

export default IngredientsScreen;
