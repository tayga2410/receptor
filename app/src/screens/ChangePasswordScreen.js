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
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async () => {
    if (!formData.currentPassword) {
      Alert.alert(t('error'), t('error_current_password'));
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert(t('error'), t('error_short_password'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert(t('error'), t('error_password_mismatch'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.users.updateProfile({
        password: formData.newPassword,
        currentPassword: formData.currentPassword,
      });

      if (response.ok) {
        Alert.alert(t('success'), t('password_changed'), [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const error = await response.json();
        if (error.message?.includes('Текущий пароль неверен') || error.message?.includes('incorrect')) {
          Alert.alert(t('error'), t('error_current_password_invalid'));
        } else {
          Alert.alert(t('error'), error.message || t('error_change_password'));
        }
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert(t('error'), t('error_network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('change_password_title')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('current_password')}</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={formData.currentPassword}
              onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
              placeholder={t('enter_current_password')}
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showCurrentPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.iconButton}>
              {showCurrentPassword ? <Eye size={20} color={COLORS.textLight} /> : <EyeOff size={20} color={COLORS.textLight} />}
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('new_password')}</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={formData.newPassword}
              onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
              placeholder={t('enter_new_password')}
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showNewPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.iconButton}>
              {showNewPassword ? <Eye size={20} color={COLORS.textLight} /> : <EyeOff size={20} color={COLORS.textLight} />}
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('confirm_password')}</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder={t('enter_confirm_password')}
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.iconButton}>
              {showConfirmPassword ? <Eye size={20} color={COLORS.textLight} /> : <EyeOff size={20} color={COLORS.textLight} />}
            </Pressable>
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
            onPress={handleChangePassword}
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
  inputGroup: {
    marginBottom: THEME.spacing.lg,
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
  },
  inputWithIconText: {
    flex: 1,
    padding: THEME.spacing.md,
    fontSize: 16,
    color: COLORS.text,
  },
  iconButton: {
    paddingHorizontal: THEME.spacing.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.xl,
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

export default ChangePasswordScreen;
