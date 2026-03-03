# Recipe Calculator Backend

Backend для приложения Recipe Calculator на NestJS.

## Установка

1. Установить зависимости:
```bash
npm install
```

2. Настроить переменные окружения:
- Создать `.env` файл
- Указать `DATABASE_URL` для PostgreSQL

3. Инициализировать базу данных:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

## Запуск

Разработка:
```bash
npm run start:dev
```

Продакшн:
```bash
npm run build
npm start
```

## API Endpoints

### Auth
- POST `/api/auth/register` — Регистрация
- POST `/api/auth/login` — Вход

### Users
- GET `/api/users/me` — Профиль пользователя
- PATCH `/api/users/me` — Обновить профиль
- PATCH `/api/users/me/currency` — Изменить валюту

### Units
- GET `/api/units` — Все единицы (системные + пользовательские)
- GET `/api/units/system` — Только системные
- POST `/api/units` — Создать
- PATCH `/api/units/:id` — Обновить
- DELETE `/api/units/:id` — Удалить

### Ingredients
- GET `/api/ingredients` — Все ингредиенты
- POST `/api/ingredients` — Создать
- GET `/api/ingredients/:id` — Получить
- PATCH `/api/ingredients/:id` — Обновить
- DELETE `/api/ingredients/:id` — Удалить

### Recipes
- GET `/api/recipes` — Все рецепты (с пагинацией)
- POST `/api/recipes` — Создать
- GET `/api/recipes/:id` — Получить
- PATCH `/api/recipes/:id` — Обновить
- DELETE `/api/recipes/:id` — Удалить

### Calculator
- POST `/api/calculator/calculate` — Расчёт себестоимости
- POST `/api/calculator/sale-price` — Расчёт цены продажи
- POST `/api/calculator/margin` — Расчёт маржи
- POST `/api/calculator/business-margin` — Бизнес-маржа
