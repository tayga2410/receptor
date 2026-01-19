import React, { useEffect } from 'react';
import { Alert } from 'react-native';

const ErrorMessage = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible && message) {
      Alert.alert('Ошибка', message, [
        { text: 'OK', onPress: () => {
          onClose();
        }}
      ]);
    }
  }, [visible, message, onClose]);

  // Компонент ничего не рендерит, Alert рендерится нативно
  return null;
};

export default ErrorMessage;
