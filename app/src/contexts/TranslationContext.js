import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS, Language } from '../constants/translations';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('RU');

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
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
