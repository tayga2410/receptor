import React, { useEffect } from 'react';
import { Alert } from 'react-native';

const ErrorMessage = ({ message, visible, onClose }) => {
  console.log('ErrorMessage props:', { message, visible });
  
  useEffect(() => {
    console.log('ErrorMessage useEffect:', { visible, message });
    if (visible && message) {
      console.log('Showing Alert with message:', message);
      Alert.alert('Ошибка', message, [
        { text: 'OK', onPress: () => {
          console.log('Alert OK pressed');
          onClose();
        }}
      ]);
    }
  }, [visible, message, onClose]);

  // Компонент ничего не рендерит, Alert рендерится нативно
  return null;
};

export default ErrorMessage;
