# Recipe Calculator — Mobile App

Мобильное приложение на React Native + Expo.

## Установка

1. Установить зависимости:
```bash
npm install
```

2. Запуск:
```bash
npm start
```

3. Выбор платформы:
- `i` — iOS симулятор
- `a` — Android эмулятор
- `w` — веб браузер
- QR код — Expo Go на телефоне

## Функции

### Авторизация
- **Welcome** — выбор языка (казахский, русский, английский)
- **Login** — вход по email/паролю (Google/Telegram заглушки)
- **Register** — регистрация

### Вкладки
1. **Рецепты** — список с себестоимостью, ценой и маржой
2. **Ингредиенты** — список с ценой за единицу
3. **Калькулятор** — расчёт себестоимости в реальном времени
4. **Профиль** — информация о подписке и настройки

## Архитектура

### State Management
- **Zustand** — глобальное состояние (auth, язык, тема)

### Navigation
- **React Navigation** — Auth Stack + Tab Navigator

### UI
- Кастомные компоненты
- Тема: светло-розовый (#FFE4E9)

### Переводы
- 3 языка: KZ, RU, EN
- Context-based система переводов

### API
- Готово к интеграции с backend
- Эндпоинты: `src/constants/api.js`
- JWT авторизация

## Стек

- React Native 0.81.5
- Expo ~54.0.31
- React 19.1.0
- React Navigation
- Zustand

## Интеграция с Backend

- URL: `http://localhost:3001/api`
- Эндпоинты: `src/constants/api.js`
- Сейчас используются mock-данные

## Roadmap

- [ ] Интеграция с реальным API
- [ ] CRUD для рецептов и ингредиентов
- [ ] Лимиты рецептов (5 бесплатно)
- [ ] In-App Purchases
- [ ] Улучшение UI
