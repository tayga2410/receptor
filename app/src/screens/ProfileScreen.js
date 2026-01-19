import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';
import Logo from '../components/Logo';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout, updateUserCurrency } = useStore();
  const [loading, setLoading] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.users.getProfile();
      if (response.ok) {
        const userData = await response.json();
        updateUserCurrency(userData.currency);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleCurrencyChange = async (currency) => {
    try {
      setUpdatingCurrency(true);
      const response = await api.users.updateCurrency(currency);
      
      if (response.ok) {
        updateUserCurrency(currency);
        setCurrencyModalVisible(false);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to update currency');
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      Alert.alert('Error', error.message || 'Network error');
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Logo size="medium" />
          <Text style={styles.userName}>{user?.name || t('guest')}</Text>
          <Text style={styles.userEmail}>{user?.email || t('not_specified')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile_info')}</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('currency_label')}</Text>
            <Text style={styles.infoValue}>
              {user?.currency ? `${user?.currency} (${getCurrencySymbol(user?.currency)})` : 'KZT (₸)'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('subscription_type')}</Text>
            <Text style={styles.infoValue}>
              {user?.subscriptionType === 'PREMIUM' ? t('premium_plan') : t('free_plan')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <Pressable style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.menuItemText}>{t('edit_profile')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
            <Text style={styles.menuItemText}>{t('change_password')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => setCurrencyModalVisible(true)}>
            <Text style={styles.menuItemText}>{t('change_currency')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => Alert.alert(t('about_app'), t('about_app_text'))}>
            <Text style={styles.menuItemText}>{t('about_app')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.premiumButton} onPress={() => Alert.alert('Info', t('premium_in_development'))}>
            <Text style={styles.premiumButtonText}>🌟 {t('go_premium')}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={currencyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('select_currency')}</Text>
            {Object.keys(CURRENCIES).map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyOption,
                  user?.currency === currency && styles.selectedOption,
                ]}
                onPress={() => handleCurrencyChange(currency)}
                disabled={updatingCurrency}
              >
                <Text
                  style={[
                    styles.currencyText,
                    user?.currency === currency && styles.selectedText,
                  ]}
                >
                  {currency} ({CURRENCIES[currency].symbol})
                </Text>
                {user?.currency === currency && (
                  <MaterialCommunityIcons name="check" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            ))}
            {updatingCurrency && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: THEME.spacing.xl,
    backgroundColor: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: THEME.spacing.md,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
  },
  section: {
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuItem: {
    backgroundColor: COLORS.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.roundness,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  premiumButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
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
    width: 280,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  currencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: `${COLORS.accent}15`,
    borderColor: COLORS.accent,
  },
  currencyText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 10,
  },
});

export default ProfileScreen;
