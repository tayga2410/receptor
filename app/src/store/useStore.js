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
  console.log('getNetworkErrorMessage called with:', JSON.stringify({
    error,
    errorMessage: error?.message,
    errorName: error?.name,
    errorString: String(error)
  }));

  if (!error) {
    return translateError('error_network', language);
  }

  // Проверяем тип ошибки
  if (error.message) {
    const msg = String(error.message).toLowerCase();
    console.log('Checking error message:', msg);
    
    if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
      console.log('Detected network request failed error');
      return translateError('error_network', language);
    }
    
    if (msg.includes('timeout') || msg.includes('timed out')) {
      console.log('Detected timeout error');
      return translateError('error_timeout', language);
    }
    
    if (msg.includes('connection refused')) {
      console.log('Detected connection refused error');
      return translateError('error_server_unavailable', language);
    }
  }

  // Проверяем имя ошибки (важно для React Native)
  if (error.name) {
    const name = String(error.name).toLowerCase();
    console.log('Checking error name:', name);
    
    if (name.includes('networkerror') || name.includes('network error')) {
      console.log('Detected network error by name');
      return translateError('error_network', language);
    }
    
    if (name.includes('timeouterror') || name.includes('timeout error')) {
      console.log('Detected timeout error by name');
      return translateError('error_timeout', language);
    }
  }

  // Проверяем строковое представление ошибки
  const errorString = String(error).toLowerCase();
  console.log('Checking error string:', errorString);
  
  if (errorString.includes('network') || errorString.includes('fetch')) {
    console.log('Detected network error in string representation');
    return translateError('error_network', language);
  }

  console.log('Using default network error message');
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
          console.log('Attempting login with:', { username, password: '***' });
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
          
          console.log('Login response:', JSON.stringify({ status: response.status, data }, null, 2));

          if (response.ok) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return { success: true };
          }

          // Детальная обработка ошибок валидации (400)
          if (response.status === 400) {
            const errorMessage = parseValidationError(data, language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок авторизации (401)
          if (response.status === 401) {
            const errorMessage = translateError('error_invalid_credentials', language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок сервера (500)
          if (response.status >= 500) {
            const errorMessage = translateError('error_server', language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка других ошибок (403, 404, и т.д.)
          const errorMessage = data?.message || translateError('error_login_failed', language);
          console.log('Error message to show:', errorMessage);
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
          console.log('Attempting registration with:', { username, password: '***' });
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
          
          console.log('Registration response:', JSON.stringify({ status: response.status, data }, null, 2));

          if (response.ok) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return { success: true };
          }

          // Детальная обработка ошибок валидации (400)
          if (response.status === 400) {
            const errorMessage = parseValidationError(data, language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок конфликта (409) - username уже существует
          if (response.status === 409) {
            const errorMessage = translateError('error_email_exists', language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка ошибок сервера (500)
          if (response.status >= 500) {
            const errorMessage = translateError('error_server', language);
            console.log('Error message to show:', errorMessage);
            return { success: false, error: errorMessage };
          }

          // Обработка других ошибок
          const errorMessage = data?.message || translateError('error_registration_failed', language);
          console.log('Error message to show:', errorMessage);
          return { success: false, error: errorMessage };
        } catch (error) {
          console.error('Registration error:', error);
          const errorMessage = getNetworkErrorMessage(error, language);
          return { success: false, error: errorMessage };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
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
