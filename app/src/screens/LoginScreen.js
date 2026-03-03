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
  const [honeypot, setHoneypot] = useState(''); // Honeypot field
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const languages = [
    { code: 'KZ', label: 'KZ' },
    { code: 'RU', label: 'RU' },
    { code: 'EN', label: 'EN' },
  ];

  const handleLogin = async () => {
    setError(null);

    // Honeypot check - если заполнено, это бот
    if (honeypot) {
      console.log('Bot detected');
      return;
    }

    if (!username || !password) {
      setError(t('error_fill_all_fields'));
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
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

        {/* Honeypot - скрытое поле для ботов */}
        <TextInput
          style={styles.honeypot}
          value={honeypot}
          onChangeText={setHoneypot}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          importantForAccessibility="no"
          accessibilityElementsHidden={true}
        />

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
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('login')}</Text>
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
  honeypot: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
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

export default LoginScreen;
