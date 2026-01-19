import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';
import useStore from '../store/useStore';

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, setUser } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Ошибка', t('error_name_empty'));
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      Alert.alert('Ошибка', t('error_invalid_email'));
      return;
    }

    if (formData.password) {
      if (!formData.currentPassword) {
        Alert.alert('Ошибка', t('error_current_password'));
        return;
      }
      
      if (formData.password.length < 6) {
        Alert.alert('Ошибка', t('error_password_short'));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Ошибка', t('error_password_mismatch'));
        return;
      }
    }

    try {
      setLoading(true);
      const updateData: any = { name: formData.name.trim() };
      
      if (formData.email) {
        updateData.email = formData.email.trim();
      }
      
      if (formData.password) {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      const response = await api.users.updateProfile(updateData);

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        Alert.alert('Успех', t('profile_updated'), [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const error = await response.json();
        if (error.message?.includes('Текущий пароль неверен') || error.message?.includes('incorrect')) {
          Alert.alert('Ошибка', t('error_current_password_invalid'));
        } else {
          Alert.alert('Ошибка', error.message || t('error_update_profile'));
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Ошибка', t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('edit_profile_title')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Личная информация</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('name_label')}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Введите имя"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email_label_short')}</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Введите email"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('password_section')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('current_password')}</Text>
            <TextInput
              style={styles.input}
              value={formData.currentPassword}
              onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
              placeholder="Введите текущий пароль"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('new_password')}</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Введите новый пароль"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('confirm_password')}</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder={t('confirm_password')}
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </Pressable>
          
          <Pressable
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  form: {
    padding: THEME.spacing.lg,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: THEME.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default EditProfileScreen;
