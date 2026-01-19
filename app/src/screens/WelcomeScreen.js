import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Logo from '../components/Logo';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const WelcomeScreen = ({ navigation }) => {
  const { t, changeLanguage } = useTranslation();

  const languages = [
    { code: 'KZ', label: 'Қазақша' },
    { code: 'RU', label: 'Русский' },
    { code: 'EN', label: 'English' },
  ];

  const handleLanguageSelect = (lang) => {
    changeLanguage(lang);
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size="large" />
        <Text style={styles.appName}>{t('app_name')}</Text>
      </View>

      <View style={styles.languageContainer}>
        <Text style={styles.title}>{t('welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('select_language')}</Text>

        {languages.map((lang) => (
          <Pressable
            key={lang.code}
            style={styles.languageButton}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <Text style={styles.languageButtonText}>{lang.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: THEME.spacing.lg,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: THEME.spacing.lg,
  },
  languageContainer: {
    paddingBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  languageButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default WelcomeScreen;
