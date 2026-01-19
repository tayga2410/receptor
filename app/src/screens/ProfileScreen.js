import React from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import Logo from '../components/Logo';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    navigation.navigate('Auth');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Logo size="medium" />
        <Text style={styles.userName}>{user?.name || 'Гость'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация о пользователе</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email || 'Не указан'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Валюта:</Text>
          <Text style={styles.infoValue}>{user?.currency || 'KZT'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Тип подписки:</Text>
          <Text style={styles.infoValue}>
            {user?.subscriptionType === 'PREMIUM' ? 'Премиум' : 'Бесплатный'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки</Text>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Редактировать профиль</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Сменить валюту</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Уведомления</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>О приложении</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.premiumButton}>
          <Text style={styles.premiumButtonText}>🌟 Перейти на Премиум</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </Pressable>
      </View>
    </ScrollView>
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
});

export default ProfileScreen;
