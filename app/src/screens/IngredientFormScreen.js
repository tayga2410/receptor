import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';

const IngredientFormScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const ingredient = route.params?.ingredient;
  const [loading, setLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [units, setUnits] = useState([]);

  const [formData, setFormData] = useState({
    name: ingredient?.name || '',
    pricePerUnit: ingredient?.pricePerUnit?.toString() || '',
    unitId: ingredient?.unitId || '',
    currency: user?.currency || 'KZT',
  });

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (route.params?.showDeleteDialog && ingredient) {
      Alert.alert(
        t('delete'),
        'Are you sure you want to delete this ingredient?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: handleDelete,
          },
        ]
      );
      navigation.setParams({ showDeleteDialog: undefined });
    }
  }, [route.params?.showDeleteDialog]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await api.ingredients.delete(ingredient.id);
      if (response.ok) {
        navigation.goBack();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to delete ingredient');
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      Alert.alert('Error', error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setUnitsLoading(true);
      const response = await api.units.getSystem();
      const data = await response.json();
      console.log('Units response:', data);
      
      // Проверяем структуру ответа
      const unitsData = Array.isArray(data) ? data : data.units || [];
      console.log('Parsed units:', unitsData);
      
      setUnits(unitsData);
      
      if (!ingredient && unitsData.length > 0) {
        setFormData((prev) => ({ ...prev, unitId: unitsData[0].id }));
      }
    } catch (error) {
      console.error('Failed to load units:', error);
      Alert.alert('Error', 'Failed to load units');
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.pricePerUnit || !formData.unitId) {
      Alert.alert('Error', t('error_fill_all_fields'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        unitId: formData.unitId,
        currency: formData.currency,
      };

      let response;
      if (ingredient?.id) {
        response = await api.ingredients.update(ingredient.id, payload);
      } else {
        response = await api.ingredients.create(payload);
      }

      if (response.ok) {
        navigation.goBack();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to save ingredient');
      }
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      Alert.alert('Error', error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('ingredient_name')}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder={t('ingredient_name')}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('ingredient_price')}</Text>
            <View style={styles.priceContainer}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={formData.pricePerUnit}
                onChangeText={(text) => setFormData({ ...formData, pricePerUnit: text })}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currencyLabel}>
                {CURRENCIES[formData.currency]?.symbol || formData.currency}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('ingredient_unit')}</Text>
            {unitsLoading ? (
              <View style={styles.input}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            ) : (
              <Picker
                selectedValue={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                style={styles.picker}
              >
                {units.map((unit) => (
                  <Picker.Item
                    key={unit.id}
                    label={unit.name}
                    value={unit.id}
                  />
                ))}
              </Picker>
            )}
          </View>

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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  currencyLabel: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    fontWeight: 'bold',
    fontSize: 16,
  },
  picker: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginTop: THEME.spacing.md,
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
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IngredientFormScreen;
