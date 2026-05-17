# Этап Web 1 — FinBuddy Analytics Dashboard

## Что внутри

```txt
React + Vite
TypeScript
Tailwind CSS
Supabase JS
Recharts
Lucide icons
```

## Реализовано

```txt
1. Отдельный React/Vite сайт.
2. Авторизация через Supabase.
3. Вход/регистрация email/password.
4. Вход через Google и Microsoft/Azure.
5. Dashboard layout с sidebar.
6. Фильтр периода: текущий месяц, прошлый месяц, март, апрель.
7. KPI: доходы, расходы, баланс, финансовый рейтинг.
8. График доходов и расходов по дням.
9. Диаграмма расходов по категориям.
10. Топ категорий.
11. Таблица последних операций.
12. Локальный AI-вывод периода.
```

## Как подключить к твоему Supabase

В корне сайта создай `.env`:

```env
VITE_SUPABASE_URL=https://urmjmmikbltwrsuqxkpl.supabase.co
VITE_SUPABASE_ANON_KEY=твой_anon_или_publishable_key
```

## Запуск

```powershell
npm install
npm run dev
```

Откроется:

```txt
http://localhost:5173
```

## Если используешь Google/Microsoft OAuth

Добавь в Supabase:

```txt
Authentication → URL Configuration → Redirect URLs
```

```txt
http://localhost:5173
```

Для production позже добавишь адрес сайта.

## Что показывать на защите

Формулировка:

```txt
Мобильное приложение предназначено для быстрого ежедневного ввода финансовых операций,
а веб-панель FinBuddy Analytics Dashboard используется для расширенной аналитики,
визуализации статистики, сравнения периодов и формирования AI-выводов.
```

## Следующий этап

```txt
Web Этап 2 — подключить настоящую Edge Function finance-ai,
добавить AI-отчёт, сравнение месяцев и экспорт отчёта.
```
