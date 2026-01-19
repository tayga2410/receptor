import React, { createContext, useContext, useEffect } from 'react';
import { TRANSLATIONS, Language } from '../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStore from '../store/useStore';

const TranslationContext = createContext();

const LANGUAGE_STORAGE_KEY = '@app_language';

export const TranslationProvider = ({ children }) => {
  const storeLanguage = useStore((state) => state.language);
  const setStoreLanguage = useStore((state) => state.setLanguage);
  const [language, setLanguage] = React.useState(storeLanguage || 'RU');

  // Загружаем язык из AsyncStorage при инициализации
  useEffect(() => {
    loadLanguage();
  }, []);

  // Синхронизируем с store
  useEffect(() => {
    if (storeLanguage && storeLanguage !== language) {
      setLanguage(storeLanguage);
    }
  }, [storeLanguage]);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        setLanguage(savedLanguage);
        setStoreLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language from storage:', error);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      setLanguage(lang);
      setStoreLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language to storage:', error);
    }
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};
