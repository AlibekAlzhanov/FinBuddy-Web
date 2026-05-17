import { useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { callFinanceAi } from '../lib/ai';
import { CategorySummary, DashboardMetrics } from '../types/finance';
import { formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type Props = {
  periodName: string;
  periodStart: Date;
  periodEnd: Date;
  metrics: DashboardMetrics;
  categories: CategorySummary[];
};

const quickPromptKeys = [
  'ai.quick.topSpending',
  'ai.quick.saveMoney',
  'ai.quick.overspendRisk',
  'ai.quick.spendingLimit',
  'ai.quick.nextMonth',
];

const buildContextPrompt = ({
  question,
  periodName,
  metrics,
  categories,
}: {
  question: string;
  periodName: string;
  metrics: DashboardMetrics;
  categories: CategorySummary[];
}) => {
  const categoryText = categories
    .slice(0, 8)
    .map(
      (category, index) =>
        `${index + 1}. ${category.name}: ${formatKzt(category.amount)} (${category.percent}%, ${category.count} операций)`,
    )
    .join('\n');

  return `
Ты AI-финансовый помощник FinBuddy Web Dashboard.
Отвечай на вопрос пользователя по данным выбранного периода.

Период: ${periodName}

Показатели:
- Доходы: ${formatKzt(metrics.totalIncome)}
- Расходы: ${formatKzt(metrics.totalExpense)}
- Баланс: ${formatKzt(metrics.balance)}
- Доля расходов от дохода: ${metrics.expensePercent}%
- Норма накопления: ${metrics.savingRate}%
- Финансовый рейтинг: ${metrics.financialScore}/100
- Прогноз расходов: ${formatKzt(metrics.forecastExpense)}
- Количество операций: ${metrics.transactionCount}

Категории:
${categoryText || 'Нет категорий расходов.'}

Вопрос пользователя:
${question}

Правила ответа:
1. Отвечай на русском языке.
2. Пиши кратко и конкретно.
3. Все суммы указывай в тенге, формат "25 000 ₸".
4. Не используй рубли.
5. Не выдумывай данных, которых нет.
6. Если данных недостаточно, честно скажи.
7. Дай 2–4 практических действия.
`;
};

export default function WebAiAssistant({
  periodName,
  periodStart,
  periodEnd,
  metrics,
  categories,
}: Props) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text:
        t('ai.assistantWelcome'),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const canAsk = useMemo(() => {
    return metrics.transactionCount > 0 && !loading;
  }, [metrics.transactionCount, loading]);

  const ask = async (questionValue?: string) => {
    const question = (questionValue || input).trim();

    if (!question || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');

    if (metrics.transactionCount === 0) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'За выбранный период нет операций. Добавьте данные или выберите другой месяц, чтобы я мог провести анализ.',
        },
      ]);
      return;
    }

    try {
      setLoading(true);

      const response = await callFinanceAi({
        question: buildContextPrompt({
          question,
          periodName,
          metrics,
          categories,
        }),
        mode: 'chat',
        periodStart,
        periodEnd,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.answer,
        },
      ]);
    } catch (error: any) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text:
            error?.message ||
            'Не удалось получить ответ от AI. Проверьте Edge Function finance-ai.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-gradient-to-br from-[#111827] to-[#1E293B] p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary">
            <Bot size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-black">{t('ai.assistantTitle')}</h2>
            <p className="text-sm font-bold text-slate-300">
              {t('ai.assistantSubtitle')}: {periodName}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickPromptKeys.map((promptKey) => {
            const prompt = t(promptKey);

            return (
            <button
              key={prompt}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-50"
              onClick={() => ask(prompt)}
              disabled={!canAsk}
            >
              {prompt}
            </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[520px] space-y-4 overflow-y-auto bg-white p-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-primary">
                  <Sparkles size={18} />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm font-bold leading-6 ${
                  isUser
                    ? 'bg-primary text-white'
                    : 'bg-soft text-slate-700'
                }`}
              >
                {message.text}
              </div>

              {isUser && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-primary">
              <Sparkles size={18} />
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-soft px-4 py-3 text-sm font-black text-muted">
              <Loader2 className="animate-spin" size={17} />
              {t('ai.analyzing')}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            className="min-h-12 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink outline-none"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                ask();
              }
            }}
            placeholder={metrics.transactionCount > 0 ? t('ai.askPlaceholder') : t('ai.noOpsPlaceholder')}
            disabled={loading}
          />

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
            onClick={() => ask()}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {t('ai.askButton')}
          </button>
        </div>
      </div>
    </section>
  );
}
