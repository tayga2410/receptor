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
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';

// Функция для сокращения названий единиц измерения
const shortenUnitName = (name, shortName) => {
  if (shortName) return shortName;

  const n = name.toLowerCase();
  if (n.includes('грамм') || n === 'г') return 'г';
  if (n.includes('килограмм') || n === 'кг') return 'кг';
  if (n.includes('штука') || n === 'шт') return 'шт';
  if (n.includes('литр') || n === 'л') return 'л';
  if (n.includes('миллилитр') || n === 'мл') return 'мл';
  return name.substring(0, 3);
};

const IngredientFormScreen = ({ route, navigation }) => {
  const { t, language } = useTranslation();
  const user = useStore((state) => state.user);
  const ingredient = route.params?.ingredient;
  const [loading, setLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [unitModalVisible, setUnitModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: ingredient?.name || '',
    price: '',
    quantity: '',
    unitId: ingredient?.unitId || '',
  });

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (route.params?.showDeleteDialog && ingredient) {
      Alert.alert(
        t('delete'),
        t('confirm_delete_ingredient'),
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
        Alert.alert(t('error'), error.message || t('error_delete_ingredient'));
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      Alert.alert(t('error'), error.message || t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setUnitsLoading(true);
      const response = await api.units.getSystem();
      const data = await response.json();

      const unitsData = Array.isArray(data) ? data : data.units || [];
      setUnits(unitsData);

      if (!ingredient && unitsData.length > 0) {
        setFormData((prev) => ({ ...prev, unitId: unitsData[0].id }));
      }
    } catch (error) {
      console.error('Failed to load units:', error);
      Alert.alert(t('error'), t('error_load_units'));
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.unitId) {
      Alert.alert(t('error'), t('error_fill_all_fields'));
      return;
    }

    try {
      setLoading(true);

      // Считаем цену за единицу
      const price = parseFloat(formData.price) || 0;
      const quantity = parseFloat(formData.quantity) || 1;
      const pricePerUnit = quantity > 0 ? price / quantity : price;

      const payload = {
        name: formData.name,
        pricePerUnit,
        unitId: formData.unitId,
        currency: user?.currency || 'KZT',
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
        Alert.alert(t('error'), error.message || t('error_save_ingredient'));
      }
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      Alert.alert(t('error'), error.message || t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  // Показываем пример расчёта
  const getPricePerUnitDisplay = () => {
    const price = parseFloat(formData.price) || 0;
    const quantity = parseFloat(formData.quantity) || 1;
    if (price > 0) {
      const pricePerUnit = price / quantity;
      const unit = units.find(u => u.id === formData.unitId);
      const unitName = unit ? shortenUnitName(unit.name, unit.shortName) : '';
      const userCurrency = user?.currency || 'KZT';
      return `${pricePerUnit.toFixed(2)} ${CURRENCIES[userCurrency]?.symbol || userCurrency} / 1 ${unitName}`;
    }
    return '-';
  };

  // Получаем отображаемое название выбранной единицы
  const getSelectedUnitName = () => {
    const unit = units.find(u => u.id === formData.unitId);
    return unit ? shortenUnitName(unit.name, unit.shortName) : '';
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
            <View style={styles.priceRowContainer}>
              <View style={styles.priceSection}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencyLabel}>
                  {CURRENCIES[user?.currency || 'KZT']?.symbol || user?.currency || 'KZT'}
                </Text>
              </View>
              <Text style={styles.forLabel}>{t('for_label')}</Text>
              <View style={styles.quantitySection}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  keyboardType="decimal-pad"
                />
                {unitsLoading ? (
                  <View style={styles.unitButton}>
                    <ActivityIndicator color={COLORS.accent} />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.unitButton} onPress={() => setUnitModalVisible(true)}>
                    <Text style={styles.unitButtonText}>{getSelectedUnitName()}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.text} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>{t('calculated_price')}: {getPricePerUnitDisplay()}</Text>
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

      {/* Modal для выбора единицы измерения */}
      <Modal
        visible={unitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('ingredient_unit')}</Text>
            <ScrollView style={styles.modalScroll}>
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[styles.unitOption, formData.unitId === unit.id && styles.selectedOption]}
                  onPress={() => {
                    setFormData({ ...formData, unitId: unit.id });
                    setUnitModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, formData.unitId === unit.id && styles.selectedText]}>
                    {shortenUnitName(unit.name, unit.shortName)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setUnitModalVisible(false)}>
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  priceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  priceSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 7,
    height: 50,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    padding: THEME.spacing.sm,
  },
  currencyLabel: {
    flex: 3,
    height: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  forLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  quantitySection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 7,
    height: 50,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    padding: THEME.spacing.sm,
  },
  unitButton: {
    flex: 3,
    height: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  unitButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  hintBox: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  unitOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default IngredientFormScreen;
