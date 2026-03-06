import React, { useEffect } from 'react';
import { useDialog } from '../contexts/DialogContext';
import useStore from '../store/useStore';
import { TRANSLATIONS } from '../constants/translations';

const ErrorMessage = ({ message, visible, onClose }) => {
  const dialog = useDialog();

  useEffect(() => {
    if (visible && message) {
      const language = useStore.getState().language || 'RU';
      const translations = TRANSLATIONS[language] || TRANSLATIONS.RU;

      dialog.alert(translations.error, message, translations.ok).then(() => {
        onClose();
      });
    }
  }, [visible, message, onClose, dialog]);

  // Компонент ничего не рендерит, диалог рендерится через DialogProvider
  return null;
};

export default ErrorMessage;
