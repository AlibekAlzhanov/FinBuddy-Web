# Web Этап 2 — AI-отчёт, сравнение месяцев, экспорт

## Что добавлено

```txt
1. Подключена Supabase Edge Function finance-ai.
2. Добавлена кнопка “Сформировать AI-отчёт”.
3. Добавлен блок AI-отчёта по выбранному периоду.
4. Добавлено сравнение текущего периода с прошлым месяцем.
5. Добавлен график сравнения доходов, расходов и баланса.
6. Добавлено сравнение топ-категорий с прошлым месяцем.
7. Добавлен экспорт отчёта в Markdown.
8. Добавлена печать отчёта / сохранение в PDF через браузер.
9. Добавлен экспорт операций в CSV.
```

## Новые файлы

```txt
src/lib/ai.ts
src/lib/compare.ts
src/lib/export.ts
docs/WEB_STAGE_2.md
```

## Обновлённые файлы

```txt
src/components/DashboardPage.tsx
README.md
```

## Как запустить

```powershell
npm install
npm run dev
```

## .env

```env
VITE_SUPABASE_URL=https://urmjmmikbltwrsuqxkpl.supabase.co
VITE_SUPABASE_ANON_KEY=твой_anon_или_publishable_key
```

## Проверка finance-ai

Функция должна быть уже задеплоена:

```powershell
npx supabase functions deploy finance-ai
```

В Supabase должен быть secret:

```powershell
npx supabase secrets list
```

Нужен:

```txt
GROQ_API_KEY
```

## Как проверить сайт

```txt
1. Войти под ruslan@gmail.com.
2. Выбрать март или апрель.
3. Нажать “Сформировать AI-отчёт”.
4. Проверить блок сравнения месяцев.
5. Скачать отчёт .md.
6. Нажать “Печать / PDF” и сохранить PDF через браузер.
7. Скачать CSV.
```

## Что говорить на защите

```txt
На Web Этапе 2 веб-панель стала аналитическим центром системы.
Она не дублирует мобильное приложение, а расширяет его:
показывает динамику, сравнивает периоды, формирует AI-отчёт через backend Edge Function
и позволяет экспортировать результаты анализа.
```
