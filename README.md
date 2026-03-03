# Recipe Calculator

Full Stack приложение для расчета себестоимости рецептов с маржой и анализом прибыльности.

**Модель:** Freemium (5 бесплатных рецептов, Premium открывает все функции)

## Стек

| Backend | Frontend |
|---------|----------|
| NestJS | React Native + Expo |
| PostgreSQL + Prisma | React Navigation |
| JWT Auth | Zustand |
| bcrypt | Multi-language (KZ/RU/EN) |

## Быстрый старт

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```
→ `http://localhost:3001`

### Mobile App
```bash
cd app
npm install
npm start
```
- `i` — iOS симулятор
- `a` — Android эмулятор
- `w` — веб браузер
- QR код — Expo Go на телефоне

## Структура

```
receptor/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/      # JWT авторизация
│   │   ├── users/     # Профили пользователей
│   │   ├── units/     # Единицы измерения
│   │   ├── ingredients/
│   │   ├── recipes/
│   │   └── calculator/
│   └── prisma/
│
└── app/               # React Native приложение
    └── src/
        ├── screens/
        ├── components/
        ├── navigation/
        ├── store/
        └── services/
```

## Функции

### Backend API
- **Auth** — регистрация, вход (JWT)
- **Users** — профиль, настройки валюты
- **Units** — системные и пользовательские единицы
- **Ingredients** — CRUD с ценами
- **Recipes** — CRUD с ингредиентами
- **Calculator** — расчет себестоимости и маржи

### Мобильное приложение
- 3 языка: казахский, русский, английский
- 4 вкладки: Рецепты, Ингредиенты, Калькулятор, Профиль
- Тема: светло-розовый дизайн

## Документация

- **Backend**: [backend/README.md](backend/README.md)
- **Frontend**: [app/README.md](app/README.md)

## Roadmap

- [ ] Лимиты рецептов (5 бесплатно, безлимит — Premium)
- [ ] Подписки с Apple/Google In-App Purchases
- [ ] Аналитика для Premium пользователей
- [ ] Интеграция с реальным API

## License

ISC
