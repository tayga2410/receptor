import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import useStore from '../store/useStore';
import { TRANSLATIONS } from '../constants/translations';

const ErrorMessage = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible && message) {
      const language = useStore.getState().language || 'RU';
      const translations = TRANSLATIONS[language] || TRANSLATIONS.RU;

      Alert.alert(translations.error, message, [
        { text: translations.ok, onPress: () => {
          onClose();
        }}
      ]);
    }
  }, [visible, message, onClose]);

  // Компонент ничего не рендерит, Alert рендерится нативно
  return null;
};

export default ErrorMessage;
