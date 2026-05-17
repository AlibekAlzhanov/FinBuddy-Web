# FinBuddy Web Analytics Dashboard — Stage 2

Веб-панель аналитики для проекта FinBuddy.

Мобильное приложение используется для быстрого добавления операций, а сайт — для углублённого анализа:
- KPI по доходам и расходам;
- графики;
- категории;
- сравнение месяцев;
- AI-отчёт через Supabase Edge Function `finance-ai`;
- экспорт отчёта и операций.

## Установка

```bash
npm install
```

## Настройка `.env`

Создай файл `.env` в корне сайта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

Можно использовать тот же Supabase URL и publishable/anon key, что в мобильном проекте.

## Запуск

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

## Supabase

Сайт использует таблицы:

```txt
transactions
categories
accounts
```

И Edge Function:

```txt
finance-ai
```

Функция должна быть задеплоена:

```bash
npx supabase functions deploy finance-ai
```

## OAuth

Вход через Google/Microsoft в Web работает через Supabase OAuth:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google' | 'azure',
  options: {
    redirectTo: window.location.origin,
  },
});
```

Если используешь OAuth на сайте, добавь в Supabase Redirect URLs адрес сайта:

```txt
http://localhost:5173
```

и будущий production URL.
