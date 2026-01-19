// Определяем базовый URL в зависимости от платформы
const getApiBaseUrl = () => {
  // Для web (браузер) используем localhost
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost') {
    // Если запущено не на localhost, используем текущий хост
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }
  
  // Для React Native (mobile) и локальной разработки
  // Используем IP-адрес компьютера для работы на мобильных устройствах
  return 'http://192.168.0.163:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  USERS: {
    ME: `${API_BASE_URL}/users/me`,
    UPDATE_CURRENCY: `${API_BASE_URL}/users/me/currency`,
  },
  UNITS: {
    LIST: `${API_BASE_URL}/units`,
    SYSTEM: `${API_BASE_URL}/units/system`,
  },
  INGREDIENTS: {
    LIST: `${API_BASE_URL}/ingredients`,
  },
  RECIPES: {
    LIST: `${API_BASE_URL}/recipes`,
  },
  CALCULATOR: {
    CALCULATE: `${API_BASE_URL}/calculator/calculate`,
  },
};
