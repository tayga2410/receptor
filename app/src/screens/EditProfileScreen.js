import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { useDialog } from '../contexts/DialogContext';
import { api } from '../services/api';
import useStore from '../store/useStore';

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dialog = useDialog();
  const { user, setUser } = useStore();

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
  });

  const emailChanged = formData.email !== (user?.email || '');
  const needsPassword = emailChanged;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      dialog.alert(t('error'), t('error_name_empty'));
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      dialog.alert(t('error'), t('error_invalid_email'));
      return;
    }

    if (needsPassword && !formData.currentPassword) {
      dialog.alert(t('error'), t('current_password_required'));
      return;
    }

    try {
      setLoading(true);
      const updateData: any = { name: formData.name.trim() };
      
      if (formData.email) {
        updateData.email = formData.email.trim();
      }
      
      if (needsPassword) {
        updateData.currentPassword = formData.currentPassword;
      }

      const response = await api.users.updateProfile(updateData);

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        await dialog.alert(t('success'), t('profile_updated'));
        navigation.goBack();
      } else {
        const error = await response.json();
        if (error.message?.includes('Текущий пароль неверен') || error.message?.includes('incorrect') || error.message?.includes('required')) {
          dialog.alert(t('error'), error.message || t('error_current_password_invalid'));
        } else {
          dialog.alert(t('error'), error.message || t('error_update_profile'));
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      dialog.alert(t('error'), t('error_network'));
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('name_label')}</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder={t('enter_name')}
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
            placeholder={t('enter_email')}
            placeholderTextColor={COLORS.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {needsPassword && (
            <Text style={styles.hint}>{t('current_password_required')}</Text>
          )}
        </View>

        {needsPassword && (
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
        )}

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
  hint: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: THEME.spacing.xs,
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

export default EditProfileScreen;
