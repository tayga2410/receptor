import { Platform, Linking } from 'react-native';
import { apiFetch } from './api';
import useStore from '../store/useStore';

// Проверяем, доступен ли Google Sign-In (только для нативных платформ с установленным модулем)
let GoogleSignin = null;
let statusCodes = null;
let isGoogleSignInAvailable = false;

const initGoogleSignIn = async () => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
    isGoogleSignInAvailable = true;
    return true;
  } catch (error) {
    console.log('Google Sign-In module not available:', error.message);
    return false;
  }
};

// Инициализируем при загрузке модуля
initGoogleSignIn();

// Инициализация Google Sign-In
export const configureGoogleSignIn = () => {
  if (!isGoogleSignInAvailable || !GoogleSignin) {
    console.log('Google Sign-In not available on this platform');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  } catch (error) {
    console.error('Failed to configure Google Sign-In:', error);
  }
};

/**
 * Проверка доступности Google Sign-In
 */
export const isGoogleSignInSupported = () => {
  return isGoogleSignInAvailable;
};

/**
 * Аутентификация через Google
 * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
 */
export const signInWithGoogle = async () => {
  // Если модуль недоступен
  if (!isGoogleSignInAvailable || !GoogleSignin) {
    return {
      success: false,
      error: Platform.OS === 'web'
        ? 'Google Sign-In is not supported on web. Please use the mobile app.'
        : 'Google Sign-In requires native module. Please rebuild the app.',
    };
  }

  try {
    // Проверяем Google Play Services (Android)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Выполняем вход
    await GoogleSignin.signIn();

    // Получаем токен
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;

    if (!idToken) {
      return { success: false, error: 'Failed to get Google ID token' };
    }

    // Отправляем токен на backend для верификации
    const response = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    }

    const errorMessage = data?.message || 'Google authentication failed';
    return { success: false, error: errorMessage };
  } catch (error) {
    console.error('Google Sign-In error:', error);

    // Обработка специфических ошибок Google Sign-In
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'cancelled' };
    } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign in is already in progress' };
    } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Google Play Services not available' };
    }

    return { success: false, error: error.message || 'Google sign in failed' };
  }
};

/**
 * Выход из Google аккаунта
 */
export const signOutFromGoogle = async () => {
  if (!isGoogleSignInAvailable || !GoogleSignin) {
    return;
  }

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google Sign-Out error:', error);
  }
};

/**
 * Telegram аутентификация
 * Использует Telegram Login Widget через браузер
 */

/**
 * Открывает Telegram бота для аутентификации через deep link
 * @param {string} botUsername - Username бота (без @)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const openTelegramBot = async (botUsername) => {
  try {
    const telegramUrl = `tg://resolve?domain=${botUsername}`;
    const fallbackUrl = `https://t.me/${botUsername}`;

    // Проверяем, можно ли открыть Telegram
    const canOpen = await Linking.canOpenURL(telegramUrl);

    if (canOpen) {
      await Linking.openURL(telegramUrl);
      return { success: true };
    } else {
      // Если Telegram не установлен, открываем веб-версию
      await Linking.openURL(fallbackUrl);
      return { success: true };
    }
  } catch (error) {
    console.error('Open Telegram error:', error);
    return { success: false, error: 'Failed to open Telegram' };
  }
};

/**
 * Аутентификация через Telegram с данными от виджета
 * @param {object} telegramData - Данные от Telegram Login Widget
 * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
 */
export const signInWithTelegram = async (telegramData) => {
  try {
    const response = await apiFetch('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(telegramData),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    }

    const errorMessage = data?.message || 'Telegram authentication failed';
    return { success: false, error: errorMessage };
  } catch (error) {
    console.error('Telegram Sign-In error:', error);
    return { success: false, error: error.message || 'Telegram sign in failed' };
  }
};

export default {
  configureGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
  openTelegramBot,
  signInWithTelegram,
  isGoogleSignInSupported,
};
