import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import Logo from '../components/Logo';
import ErrorMessage from '../components/ErrorMessage';
import useStore from '../store/useStore';

const LoginScreen = ({ navigation }) => {
  const { t, language, changeLanguage } = useTranslation();
  const login = useStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const languages = [
    { code: 'KZ', label: 'KZ', flag: '🇰🇿' },
    { code: 'RU', label: 'RU', flag: '🇷🇺' },
    { code: 'EN', label: 'EN', flag: '🇬🇧' },
  ];

  const handleLogin = async () => {
    setError(null);
    console.log('handleLogin called');

    if (!username || !password) {
      console.log('Validation failed: empty fields');
      setError(t('error_fill_all_fields'));
      return;
    }

    setLoading(true);
    console.log('Calling login with:', { username });
    const result = await login(username, password);
    console.log('Login result:', result);
    setLoading(false);

    if (!result.success) {
      console.log('Login failed, setting error:', result.error);
      setError(result.error);
    }
  };

  return (
    <View style={styles.container}>
      <ErrorMessage
        message={error}
        visible={!!error}
        onClose={() => setError(null)}
      />

      <View style={styles.logoContainer}>
        <Logo size="medium" />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>{t('login')}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('enter_username')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              placeholder={t('enter_password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.iconButton}>
              {showPassword ? <Eye size={20} color={COLORS.textLight} /> : <EyeOff size={20} color={COLORS.textLight} />}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.forgotPassword}>
          <Text style={styles.link}>{t('forgot_password')}</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Загрузка...' : t('login')}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.socialButton}>
          <Text style={styles.socialButtonText}>G {t('google_auth')}</Text>
        </Pressable>

        <Pressable style={styles.socialButton}>
          <Text style={styles.socialButtonText}>T {t('telegram_auth')}</Text>
        </Pressable>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>{t('no_account')} </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{t('register')}</Text>
          </Pressable>
        </View>

        <View style={styles.languageSwitcher}>
          {languages.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.languageButton,
                language === lang.code && styles.languageButtonActive,
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <Text style={styles.languageButtonText}>{lang.flag} {lang.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: THEME.spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  inputContainer: {
    marginBottom: THEME.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 16,
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
  },
  iconButton: {
    paddingHorizontal: THEME.spacing.md,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.md,
  },
  link: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: THEME.spacing.md,
    color: COLORS.textLight,
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.roundness * 2,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  languageSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
  },
  languageButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.roundness,
    marginHorizontal: THEME.spacing.xs,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default LoginScreen;
