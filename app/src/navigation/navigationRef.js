import React from 'react';

// Глобальный reference на навигацию для использования вне компонентов
// Этот файл изолирован от других модулей, чтобы избежать циклических зависимостей
export const navigationRef = React.createRef();
