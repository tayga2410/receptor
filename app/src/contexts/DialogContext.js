import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const DialogContext = createContext(null);

// Глобальная ссылка для использования вне React-компонентов
let globalDialogRef = null;

/**
 * Получить глобальную ссылку на диалог для использования вне React-компонентов
 * Пример: import { getGlobalDialog } from '../contexts/DialogContext';
 *         getGlobalDialog().alert('Title', 'Message');
 */
export const getGlobalDialog = () => {
  if (!globalDialogRef) {
    console.warn('DialogProvider is not mounted yet');
    return null;
  }
  return globalDialogRef;
};

/**
 * Провайдер для управления диалогами
 * Предоставляет методы alert() и confirm() которые работают на iOS и Android
 */
export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, visible: false }));
  }, []);

  /**
   * Показать alert диалог с одной кнопкой OK
   * @param {string} title - Заголовок
   * @param {string} message - Сообщение
   * @param {string} buttonText - Текст кнопки (по умолчанию 'OK')
   */
  const alert = useCallback((title, message, buttonText = 'OK') => {
    return new Promise((resolve) => {
      setDialogState({
        visible: true,
        title,
        message,
        buttons: [
          {
            text: buttonText,
            onPress: () => {
              hideDialog();
              resolve(true);
            },
          },
        ],
      });
    });
  }, [hideDialog]);

  /**
   * Показать confirm диалог с кнопками подтверждения и отмены
   * @param {string} title - Заголовок
   * @param {string} message - Сообщение
   * @param {object} options - Опции
   * @param {string} options.confirmText - Текст кнопки подтверждения (по умолчанию 'OK')
   * @param {string} options.cancelText - Текст кнопки отмены (по умолчанию 'Отмена')
   * @param {boolean} options.destructive - Показать кнопку подтверждения красной (для удаления и т.п.)
   */
  const confirm = useCallback((title, message, options = {}) => {
    const {
      confirmText = 'OK',
      cancelText = 'Отмена',
      destructive = false,
    } = options;

    return new Promise((resolve) => {
      setDialogState({
        visible: true,
        title,
        message,
        buttons: [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => {
              hideDialog();
              resolve(false);
            },
          },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'default',
            onPress: () => {
              hideDialog();
              resolve(true);
            },
          },
        ],
      });
    });
  }, [hideDialog]);

  /**
   * Показать кастомный диалог с произвольными кнопками
   * @param {string} title - Заголовок
   * @param {string} message - Сообщение
   * @param {Array} buttons - Массив кнопок [{text, style, onPress}]
   */
  const show = useCallback((title, message, buttons = []) => {
    setDialogState({
      visible: true,
      title,
      message,
      buttons: buttons.map(btn => ({
        ...btn,
        onPress: () => {
          hideDialog();
          if (btn.onPress) btn.onPress();
        },
      })),
    });
  }, [hideDialog]);

  // Устанавливаем глобальную ссылку
  useEffect(() => {
    globalDialogRef = { alert, confirm, show, hideDialog };
    return () => {
      globalDialogRef = null;
    };
  }, [alert, confirm, show, hideDialog]);

  return (
    <DialogContext.Provider value={{ alert, confirm, show, hideDialog }}>
      {children}
      <ConfirmDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </DialogContext.Provider>
  );
};

/**
 * Хук для использования диалогов
 * @returns {{ alert, confirm, show, hideDialog }}
 *
 * Примеры использования:
 *
 * // Alert:
 * await dialog.alert('Ошибка', 'Не удалось загрузить данные');
 *
 * // Confirm:
 * const result = await dialog.confirm('Удалить?', 'Это действие нельзя отменить', {
 *   confirmText: 'Удалить',
 *   cancelText: 'Отмена',
 *   destructive: true,
 * });
 * if (result) { // пользователь нажал "Удалить" }
 *
 * // Кастомные кнопки:
 * dialog.show('Выберите', 'Что делать?', [
 *   { text: 'Отмена', style: 'cancel' },
 *   { text: 'Сохранить', onPress: handleSave },
 *   { text: 'Удалить', style: 'destructive', onPress: handleDelete },
 * ]);
 */
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export default DialogContext;
