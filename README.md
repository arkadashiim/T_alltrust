# AllTrust Payment Service

Сервис приёма платежей: создание инвойсов с расчётом комиссии, обработка вебхуков с HMAC-подписью и идемпотентностью, получение статуса инвойса.

## Стек

Node.js, Express, MongoDB, Redis, TypeScript, Jest

## Требования

- Node.js 20+
- Docker и Docker Compose

## Установка

```
git clone <repo-url>
cd alltrust
npm install
```

## Настройка

Скопировать `.env` и при необходимости изменить порты:

```
cp .env.sample .env
```

## Запуск

```
# Да, в ТЗ было указано, что docker не нужен, но так удобнее всего создать среду
docker compose up -d

# Создать тестового мерчанта
npm run seed

# Запустить сервер
npm run dev
```

Сервер будет доступен на `http://localhost:3000`.

## Swagger

Документация API доступна по адресу: `http://localhost:3000/api-docs`

## API

### POST /invoice — Создание инвойса

### GET /invoice/:id — Получение инвойса по ID

### POST /webhook — Обновление статуса инвойса (требует HMAC-подпись)

Подробная документация с примерами запросов и ответов доступна в Swagger UI.

### Отправка вебхука

Для ручного тестирования есть скрипт, который формирует HMAC-подпись и сразу отправляет запрос:

```
node scripts/send-webhook.js <invoiceId> [status]
```

- `status` — `paid` или `failed` (по умолчанию `paid`)
- `WEBHOOK_SECRET` — секрет для подписи (по умолчанию `my-secret-key`)
- `BASE_URL` — адрес сервера (по умолчанию `http://localhost:3000`)

## Тесты

Тесты не требуют Docker — используется in-memory MongoDB и мок Redis.

```
npm test
```

## Сборка

```
npm run build
npm start
```

## Структура проекта

```
src/
├── app.ts                    Express-приложение
├── server.ts                 Точка входа
├── config.ts                 Конфигурация из .env
├── seed.ts                   Скрипт создания тестового мерчанта
├── swagger.ts                OpenAPI-спецификация
├── models/
│   ├── invoice.ts            Mongoose-схема инвойса
│   └── merchant.ts           Mongoose-схема мерчанта
├── services/
│   ├── payment.ts            PaymentService — создание инвойсов, обработка вебхуков
│   └── webhook.ts            WebhookService — верификация подписи и timestamp
├── middleware/
│   └── verifySignature.ts    Мидлвара проверки HMAC-подписи
├── routes/
│   ├── invoice.ts            POST /invoice, GET /invoice/:id
│   └── webhook.ts            POST /webhook
└── utils/
    ├── redis.ts              Клиент Redis, работа с nonce
    └── math.ts               Арифметика для денежных расчётов по ТЗ
```
