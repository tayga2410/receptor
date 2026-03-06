import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStore from '../store/useStore';
import { navigationRef } from '../navigation/navigationRef';
import { getGlobalDialog } from '../contexts/DialogContext';
import { TRANSLATIONS } from '../constants/translations';

const TOKEN_STORAGE_KEY = '@app_token';

let token = null;

// Инициализация токена из AsyncStorage
const initializeToken = async () => {
  try {
    const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      token = savedToken;
    }
  } catch (error) {
    console.error('Failed to load token from storage:', error);
  }
};

// Запускаем инициализацию
initializeToken();

// Подписываемся на изменения токена в store
let unsubscribe = null;
const subscribeToTokenChanges = () => {
  if (unsubscribe) return;

  unsubscribe = useStore.subscribe(
    (state) => state.token,
    (newToken) => {
      token = newToken;
      if (newToken) {
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken).catch((error) => {
          console.error('Failed to save token to storage:', error);
        });
      } else {
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY).catch((error) => {
          console.error('Failed to remove token from storage:', error);
        });
      }
    }
  );
};

// Запускаем подписку при первом вызове
let subscriptionInitialized = false;
const ensureSubscription = () => {
  if (!subscriptionInitialized) {
    subscribeToTokenChanges();
    subscriptionInitialized = true;
  }
};

export const setAuthToken = (newToken) => {
  token = newToken;
  ensureSubscription();
};

// Функция для создания запроса с таймаутом
const fetchWithTimeout = async (url, options, timeout = 15000) => {
  // Проверяем поддержку AbortController
  let controller = null;
  let timeoutId = null;

  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Если ошибка из-за таймаута
    if (error.name === 'AbortError' || String(error).includes('abort')) {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }

    // Если ошибка сети (важно для React Native)
    if (String(error).includes('Network') || String(error).includes('network')) {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      throw networkError;
    }

    throw error;
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Получаем свежий токен из store
  const currentToken = useStore.getState().token || token;

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers,
    }, options.timeout || 15000);

    // Обработка 401 Unauthorized
    if (response.status === 401) {
      const state = useStore.getState();

      // Если у пользователя уже есть токен - значит сессия истекла
      // Если токена нет (например, при логине) - это просто неверные креды
      if (state.token || state.isAuthenticated) {

        const language = state.language || 'RU';
        const translations = TRANSLATIONS[language] || TRANSLATIONS.RU;

        // Показываем пользователю уведомление через кроссплатформенный диалог
        const dialog = getGlobalDialog();
        if (dialog) {
          dialog.alert(
            translations.session_expired,
            translations.session_expired_message,
            translations.ok
          ).then(() => {
            state.logout();

            // Перенаправляем на экран логина
            if (navigationRef.current && navigationRef.current.reset) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            }
          });
        }

        const authError = new Error('Session expired. Please login again.');
        authError.name = 'AuthError';
        authError.status = 401;
        throw authError;
      }

      // Если токена нет - просто возвращаем response, вызывающий код обработает
      return response;
    }

    return response;
  } catch (error) {
    // Если это наша ошибка авторизации, просто пробрасываем дальше
    if (error.name === 'AuthError') {
      throw error;
    }

    console.error(`API Error [${endpoint}]:`, {
      name: error.name,
      message: error.message,
      string: String(error),
      endpoint,
      url
    });

    // Добавляем больше контекста к ошибке
    const enhancedError = new Error(error.message || 'Network request failed');
    enhancedError.name = error.name || 'NetworkError';
    enhancedError.originalError = error;
    enhancedError.endpoint = endpoint;
    enhancedError.url = url;

    throw enhancedError;
  }
};

export const api = {
  auth: {
    register: (data) => apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data) => apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  users: {
    getProfile: () => apiFetch('/users/me'),
    updateProfile: (data) => apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    updateCurrency: (currency) => apiFetch('/users/me/currency', {
      method: 'PATCH',
      body: JSON.stringify({ currency }),
    }),
  },
  units: {
    getAll: () => apiFetch('/units'),
    getSystem: () => apiFetch('/units/system'),
    create: (data) => apiFetch('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => apiFetch(`/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/units/${id}`, {
      method: 'DELETE',
    }),
  },
  ingredients: {
    getAll: () => apiFetch('/ingredients'),
    create: (data) => apiFetch('/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getOne: (id) => apiFetch(`/ingredients/${id}`),
    update: (id, data) => apiFetch(`/ingredients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/ingredients/${id}`, {
      method: 'DELETE',
    }),
  },
  recipes: {
    getAll: (page = 1, limit = 10) => apiFetch(`/recipes?page=${page}&limit=${limit}`),
    create: (data) => apiFetch('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getOne: (id) => apiFetch(`/recipes/${id}`),
    update: (id, data) => apiFetch(`/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/recipes/${id}`, {
      method: 'DELETE',
    }),
  },
  calculator: {
    calculate: (ingredients) => apiFetch('/calculator/calculate', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    }),
  },
  expenses: {
    getAll: () => apiFetch('/expenses'),
    create: (data) => apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => apiFetch(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/expenses/${id}`, {
      method: 'DELETE',
    }),
  },
  expenseItems: {
    getAll: () => apiFetch('/expense-items'),
    create: (data) => apiFetch('/expense-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => apiFetch(`/expense-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/expense-items/${id}`, {
      method: 'DELETE',
    }),
  },
  sales: {
    getAll: (startDate, endDate) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString() ? `?${params}` : '';
      return apiFetch(`/sales${query}`);
    },
    getCalendar: (year, month) => apiFetch(`/sales/calendar?year=${year}&month=${month}`),
    getAnalytics: (startDate, endDate) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString() ? `?${params}` : '';
      return apiFetch(`/sales/analytics${query}`);
    },
    getByDate: (date) => apiFetch(`/sales/date/${date}`),
    getOne: (id) => apiFetch(`/sales/${id}`),
    create: (data) => apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => apiFetch(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/sales/${id}`, {
      method: 'DELETE',
    }),
    removePortion: (recordId, itemId, quantity = 1) => apiFetch(`/sales/${recordId}/items/${itemId}/remove-portion`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
    addPortion: (recordId, itemId, quantity = 1) => apiFetch(`/sales/${recordId}/items/${itemId}/add-portion`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
    removeItem: (recordId, itemId) => apiFetch(`/sales/${recordId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  },
  admin: {
    getDashboard: () => apiFetch('/admin/dashboard'),
    getUsers: () => apiFetch('/admin/users'),
    searchUsers: (query) => apiFetch(`/admin/users/search?q=${encodeURIComponent(query)}`),
    grantAmbassador: (userId, months = 12) => apiFetch(`/admin/users/${userId}/ambassador`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    }),
    grantPremium: (userId, months = 1) => apiFetch(`/admin/users/${userId}/premium`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    }),
    revokeSubscription: (userId) => apiFetch(`/admin/users/${userId}/revoke`, {
      method: 'POST',
    }),
    deleteUser: (userId) => apiFetch(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
  },
  billing: {
    verifyGoogle: (data) => apiFetch('/billing/verify/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    verifyApple: (data) => apiFetch('/billing/verify/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getStatus: () => apiFetch('/billing/status'),
  },
};
