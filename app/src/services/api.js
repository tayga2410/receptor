import { API_BASE_URL } from '../constants/api';

let token = null;

export const setAuthToken = (newToken) => {
  token = newToken;
};

// Функция для создания запроса с таймаутом
const fetchWithTimeout = async (url, options, timeout = 15000) => {
  console.log(`fetchWithTimeout: ${url}, timeout: ${timeout}ms`);
  
  // Проверяем поддержку AbortController
  let controller = null;
  let timeoutId = null;
  
  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => {
      console.log(`Request timeout for ${url}`);
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
    
    console.error('fetchWithTimeout error:', {
      name: error.name,
      message: error.message,
      string: String(error)
    });
    
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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`apiFetch: ${url}`);
    const response = await fetchWithTimeout(url, {
      ...options,
      headers,
    }, options.timeout || 15000);

    return response;
  } catch (error) {
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
};
