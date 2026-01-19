import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text, ScrollView } from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import Logo from '../components/Logo';
import ErrorMessage from '../components/ErrorMessage';
import useStore from '../store/useStore';

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const register = useStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    setError(null);

    if (!username || !name || !email || !password || !confirmPassword) {
      setError(t('error_fill_all_fields'));
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    const result = await register(username, name, email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.label}>{t('username')}</Text>
          <TextInput
            style={styles.input}
            placeholder="ваш логин"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('name')}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('confirm_password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Загрузка...' : t('register')}</Text>
        </Pressable>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Уже есть аккаунт? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>{t('login')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  inputContainer: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    fontSize: 16,
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
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default RegisterScreen;
