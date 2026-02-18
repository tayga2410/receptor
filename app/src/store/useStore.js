import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from '../constants/translations';

// Функция для перевода сообщений об ошибках
const translateError = (errorKey, language = 'RU') => {
  const translations = TRANSLATIONS[language] || TRANSLATIONS.RU;
  return translations[errorKey] || TRANSLATIONS.RU[errorKey] || errorKey;
};

// Функция для парсинга ошибок валидации от NestJS
const parseValidationError = (data, language = 'RU') => {
  const errorMessages = [];

  if (Array.isArray(data.message)) {
    // NestJS возвращает message как массив строк
    data.message.forEach(msg => {
      if (msg.includes('email must be an email')) {
        errorMessages.push(translateError('error_invalid_email', language));
      } else if (msg.includes('password must be longer')) {
        errorMessages.push(translateError('error_short_password', language));
      } else if (msg.includes('username must be a string')) {
        errorMessages.push(translateError('error_fill_all_fields', language));
      } else if (msg.includes('username should not be empty')) {
        errorMessages.push(translateError('error_fill_all_fields', language));
      } else if (msg.includes('email should not be empty')) {
        errorMessages.push(translateError('error_fill_all_fields', language));
      } else if (msg.includes('password should not be empty')) {
        errorMessages.push(translateError('error_fill_all_fields', language));
      } else {
        errorMessages.push(msg);
      }
    });
  } else if (data.message) {
    errorMessages.push(data.message);
  }

  return errorMessages.join('. ');
};

// Функция для получения понятного сообщения об ошибке сети
const getNetworkErrorMessage = (error, language = 'RU') => {
  if (!error) {
    return translateError('error_network', language);
  }

  // Проверяем тип ошибки
  if (error.message) {
    const msg = String(error.message).toLowerCase();

    if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
      return translateError('error_network', language);
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
      return translateError('error_timeout', language);
    }

    if (msg.includes('connection refused')) {
      return translateError('error_server_unavailable', language);
    }
  }

  // Проверяем имя ошибки (важно для React Native)
  if (error.name) {
    const name = String(error.name).toLowerCase();

    if (name.includes('networkerror') || name.includes('network error')) {
      return translateError('error_network', language);
    }

    if (name.includes('timeouterror') || name.includes('timeout error')) {
      return translateError('error_timeout', language);
    }
  }

  // Проверяем строковое представление ошибки
  const errorString = String(error).toLowerCase();

  if (errorString.includes('network') || errorString.includes('fetch')) {
    return translateError('error_network', language);
  }

  return translateError('error_network', language);
};

const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      language: 'RU',
      theme: 'light',

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      updateUser: (userData) => {
        const user = useStore.getState().user;
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
      updateUserCurrency: (currency) => {
        const user = useStore.getState().user;
        if (user) {
          set({ user: { ...user, currency } });
        }
      },

      login: async (username, password) => {
        const { apiFetch } = require('../services/api');
        const state = useStore.getState();
        const language = state.language || 'RU';

        try {
          const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          });

          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            data = { message: 'Не удалось прочитать ответ сервера' };
          }

          if (response.ok) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return { success: true };
          }

          // Детальная обработка ошибок валидации (400)
          if (response.status === 400) {
            const errorMessage = parseValidationError(data, language);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок авторизации (401)
          if (response.status === 401) {
            const errorMessage = translateError('error_invalid_credentials', language);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок сервера (500)
          if (response.status >= 500) {
            const errorMessage = translateError('error_server', language);
            return { success: false, error: errorMessage };
          }

          // Обработка других ошибок (403, 404, и т.д.)
          const errorMessage = data?.message || translateError('error_login_failed', language);
          return { success: false, error: errorMessage };
        } catch (error) {
          console.error('Login error:', error);
          const errorMessage = getNetworkErrorMessage(error, language);
          return { success: false, error: errorMessage };
        }
      },

      register: async (username, password) => {
        const { apiFetch } = require('../services/api');
        const state = useStore.getState();
        const language = state.language || 'RU';

        try {
          const response = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          });

          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            data = { message: 'Не удалось прочитать ответ сервера' };
          }

          if (response.ok) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return { success: true };
          }

          // Детальная обработка ошибок валидации (400)
          if (response.status === 400) {
            const errorMessage = parseValidationError(data, language);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок конфликта (409) - username уже существует
          if (response.status === 409) {
            const errorMessage = translateError('error_email_exists', language);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок сервера (500)
          if (response.status >= 500) {
            const errorMessage = translateError('error_server', language);
            return { success: false, error: errorMessage };
          }

          // Обработка других ошибок
          const errorMessage = data?.message || translateError('error_registration_failed', language);
          return { success: false, error: errorMessage };
        } catch (error) {
          console.error('Registration error:', error);
          const errorMessage = getNetworkErrorMessage(error, language);
          return { success: false, error: errorMessage };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      // OAuth аутентификация через Google
      loginWithGoogle: async () => {
        const { signInWithGoogle } = require('../services/OAuthService');
        const state = useStore.getState();
        const language = state.language || 'RU';

        try {
          const result = await signInWithGoogle();

          if (result.success) {
            set({ user: result.user, token: result.token, isAuthenticated: true });
            return { success: true };
          }

          // Если пользователь отменил вход
          if (result.error === 'cancelled') {
            return { success: false, error: 'cancelled' };
          }

          const errorMessage = translateError('error_google_auth', language);
          return { success: false, error: result.error || errorMessage };
        } catch (error) {
          console.error('Google login error:', error);
          const errorMessage = getNetworkErrorMessage(error, language);
          return { success: false, error: errorMessage };
        }
      },

      // OAuth аутентификация через Telegram
      loginWithTelegram: async (telegramData) => {
        const { signInWithTelegram } = require('../services/OAuthService');
        const state = useStore.getState();
        const language = state.language || 'RU';

        try {
          const result = await signInWithTelegram(telegramData);

          if (result.success) {
            set({ user: result.user, token: result.token, isAuthenticated: true });
            return { success: true };
          }

          const errorMessage = translateError('error_telegram_auth', language);
          return { success: false, error: result.error || errorMessage };
        } catch (error) {
          console.error('Telegram login error:', error);
          const errorMessage = getNetworkErrorMessage(error, language);
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);

export default useStore;
