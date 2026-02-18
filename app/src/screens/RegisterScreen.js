import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text, ActivityIndicator, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import Logo from '../components/Logo';
import ErrorMessage from '../components/ErrorMessage';
import useStore from '../store/useStore';
import { configureGoogleSignIn, openTelegramBot, isGoogleSignInSupported } from '../services/OAuthService';

const RegisterScreen = ({ navigation }) => {
  const { t, language, changeLanguage } = useTranslation();
  const register = useStore((state) => state.register);
  const loginWithGoogle = useStore((state) => state.loginWithGoogle);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const languages = [
    { code: 'KZ', label: 'KZ' },
    { code: 'RU', label: 'RU' },
    { code: 'EN', label: 'EN' },
  ];

  // Конфигурируем Google Sign-In при загрузке экрана
  useEffect(() => {
    const init = async () => {
      configureGoogleSignIn();
      setTimeout(() => {
        setGoogleAvailable(isGoogleSignInSupported());
      }, 100);
    };
    init();
  }, []);

  const handleRegister = async () => {
    setError(null);

    if (!username || !password || !confirmPassword) {
      setError(t('error_fill_all_fields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('error_password_mismatch'));
      return;
    }

    setLoading(true);
    const result = await register(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (!result.success && result.error !== 'cancelled') {
        setError(result.error || t('error_google_auth'));
      }
    } catch (err) {
      setError(t('error_google_auth'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleTelegramRegister = async () => {
    // Telegram Login Widget требует настройки бота
    setError('Telegram авторизация требует настройки бота. Обратитесь к администратору.');
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
        <Text style={styles.title}>{t('register')}</Text>

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

        <View style={styles.inputContainer}>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              placeholder={t('enter_confirm_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.iconButton}>
              {showConfirmPassword ? <Eye size={20} color={COLORS.textLight} /> : <EyeOff size={20} color={COLORS.textLight} />}
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('register')}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Показываем OAuth кнопки только если доступен нативный модуль или не на вебе */}
        {(googleAvailable || Platform.OS !== 'web') && (
          <Pressable
            style={[styles.socialButton, googleLoading && styles.disabledButton]}
            onPress={handleGoogleRegister}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Text style={styles.socialButtonText}>G {t('google_sign_in')}</Text>
            )}
          </Pressable>
        )}

        {Platform.OS !== 'web' && (
          <Pressable
            style={styles.socialButton}
            onPress={handleTelegramRegister}
          >
            <Text style={styles.socialButtonText}>T {t('telegram_sign_in')}</Text>
          </Pressable>
        )}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('no_account')} </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>{t('login')}</Text>
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
              <Text style={styles.languageButtonText}>{lang.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.privacyLink}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.privacyText}>{t('privacy_policy')}</Text>
        </Pressable>
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
    marginTop: THEME.spacing.md,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
  },
  loginText: {
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
  privacyLink: {
    marginTop: THEME.spacing.lg,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
