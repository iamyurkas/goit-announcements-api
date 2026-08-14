# REST API Дошки оголошень

REST API для дошки оголошень з JWT-автентифікацією, авторизацією та контролем доступу. Реалізовано в рамках курсового завдання магістратури.

## Загальний опис

Чистий JSON API без рендерингу HTML. Бекенд обслуговує клієнтів (React-застосунки, мобільні додатки тощо) через HTTP-запити.

Користувачі можуть публікувати, редагувати та видаляти власні оголошення. Анонімні відвідувачі бачать список оголошень і можуть переглядати деталі. Для створення оголошення потрібна реєстрація. Редагувати та видаляти можна лише власні оголошення.

Автентифікація — JWT з refresh токенами. Access token: 15 хвилин, refresh token: 7 днів. Token rotation для refresh токенів.

API підтримує завантаження фотографій оголошень через Cloudinary.

## Технологічний стек

| Технологія                     | Опис                             |
| ------------------------------ | -------------------------------- |
| Node.js                        | Середовище виконання             |
| TypeScript                     | Мова програмування               |
| Express 5                      | Веб-фреймворк                    |
| Prisma 7                       | ORM для бази даних (PostgreSQL)  |
| Zod                            | Валідація вхідних даних          |
| bcrypt                         | Хешування паролів                |
| jsonwebtoken                   | JWT-автентифікація               |
| Helmet                         | Безпечні HTTP-заголовки          |
| cors                           | CORS policy                      |
| express-rate-limit             | Rate limiting для auth-маршрутів |
| Pino / pino-http               | Логування                        |
| Multer                         | Обробка multipart/form-data      |
| Cloudinary                     | Зберігання зображень             |
| @asteasolutions/zod-to-openapi | Генерація OpenAPI документації   |
| swagger-ui-express             | Swagger UI                       |
| Vitest                         | Автоматизоване тестування        |
| dotenv                         | Змінні середовища                |

## Встановлення

1. Встановіть залежності:

```bash
npm install
```

2. Створіть файл конфігурації:

```bash
cp .env.example .env
```

3. Налаштуйте `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/announcements?schema=public
JWT_SECRET=your-secret-key-at-least-256-bits-long

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

4. Застосуйте міграцію:

```bash
npm run prisma:migrate
```

5. Запустіть проект:

```bash
npm run dev
```

Development server працює через `tsx --watch` і автоматично перезапускається після змін у коді.

## Безпека

### Helmet

Helmet підключений глобально та додає безпечні HTTP-заголовки до відповідей API.

### CORS

Дозволені origins задаються через змінну середовища:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Запити з інших origins блокуються.

### Rate limiting

Rate limiting застосовується до `/auth` маршрутів.
Ліміт:

- 10 запитів;
- з однієї IP-адреси;
- протягом 15 хвилин.

При перевищенні ліміту API повертає HTTP `429`:

```json
{
  "error": "Too many requests, please try again later"
}
```

## Логування

Для логування використовується Pino.

`pino-http` автоматично логує HTTP-запити.

Також логуються основні події застосунку, зокрема:

- реєстрація користувача;
- вхід користувача;
- створення оголошення;
- завантаження фотографії.

## Маршрути

### Auth

| Метод | Шлях             | Опис                          | Auth |
| ----- | ---------------- | ----------------------------- | ---- |
| POST  | `/auth/register` | Реєстрація користувача        | Ні   |
| POST  | `/auth/login`    | Вхід користувача              | Ні   |
| POST  | `/auth/refresh`  | Оновлення токенів             | Ні   |
| POST  | `/auth/logout`   | Вихід                         | Так  |
| GET   | `/auth/me`       | Профіль поточного користувача | Так  |

### Оголошення

| Метод  | Шлях                 | Опис                                      | Auth |
| ------ | -------------------- | ----------------------------------------- | ---- |
| GET    | `/announcements`     | Список з пагінацією, пошуком, сортуванням | Ні   |
| GET    | `/announcements/:id` | Деталі оголошення                         | Ні   |
| POST   | `/announcements`     | Створення оголошення                      | Так  |
| PATCH  | `/announcements/:id` | Часткове оновлення (власне)               | Так  |
| DELETE | `/announcements/:id` | Видалення (власне)                        | Так  |

## Параметри запитів

### GET /announcements

| Параметр | Тип   | Опис                                            |
| -------- | ----- | ----------------------------------------------- |
| `search` | query | Пошук по назві (нечутливий до регістру)         |
| `sort`   | query | `newest` (за замовчуванням) або `oldest`        |
| `page`   | query | Номер сторінки (число > 0), 10 записів/сторінка |

### POST /auth/register

| Поле       | Вимоги                                  |
| ---------- | --------------------------------------- |
| `username` | рядок, обов'язковий, 3–30 символів      |
| `email`    | email, обов'язковий                     |
| `password` | рядок, обов'язковий, мінімум 6 символів |
| `name`     | рядок, обов'язковий, мінімум 2 символи  |

### POST /announcements

| Поле          | Вимоги                                                 |
| ------------- | ------------------------------------------------------ |
| `title`       | рядок, обов'язковий, 5–50 символів                     |
| `description` | рядок, обов'язковий, мінімум 10 символів               |
| `price`       | число, обов'язкове, > 0                                |
| `category`    | рядок, обов'язковий: `sale`, `service`, `job`, `other` |
| `image`       | файл зображення, опціональний                          |

Запит надсилається як `multipart/form-data`.

PATCH використовує ті ж правила валідації, але всі поля опціональні (хоча б одне має бути присутнє).

Після отримання зображення Multer тимчасово зберігає файл у `uploads/`. Файл завантажується в Cloudinary, після чого локальна тимчасова копія видаляється.

У базі даних зберігається URL зображення в опціональному полі `imageUrl`.

### PATCH /announcements/:id

Використовує `multipart/form-data`.

Застосовуються ті самі правила валідації, але поля є опціональними. Має бути передано хоча б одне поле.

Фотографію також можна оновити через поле `image`.

## Тестування

Для тестування використовується Vitest.

Запуск тестів:

```bash
npm test
```

Тести перевіряють базову валідацію auth-даних та хешування паролів.

## Структура проекту

```text
goit-announcements-api/
├── prisma/
│   ├── schema.prisma
│   ├── client.ts
│   └── migrations/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── announcements.controller.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── upload.ts
│   │   └── validate.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── announcements.routes.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── announcements.validator.ts
│   ├── cloudinary.ts
│   ├── logger.ts
│   └── openapi.ts
├── tests/
│   └── auth.test.ts
├── uploads/
│   └── .gitkeep
├── app.ts
├── .env.example
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── prisma.config.ts
└── README.md
```

## Доступні скрипти

| Команда                   | Опис                                 |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Запуск з hot reload (`node --watch`) |
| `npm start`               | Запуск у виробничому режимі          |
| `npm test`                | Запуск тестів Vitest                 |
| `npm run prisma:migrate`  | Створення та застосування міграцій   |
| `npm run prisma:generate` | Генерація Prisma Client              |

## Документація API

Swagger UI доступний за адресою: http://localhost:3000/api-docs

## Prisma schema

Три моделі: `User`, `RefreshToken`, `Announcement`.

- `User` — `username` (унікальний), хешований `password`, `email` (унікальний), `name`, `createdAt`
- `RefreshToken` — `token` (унікальний), зв'язок з `User`
- `Announcement` — `title`, `description`, `price`, `category`, опціональний `imageUrl`, зв'язок з `User`, `createdAt`, `updatedAt`

## Ліцензія

ISC
