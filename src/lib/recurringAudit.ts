import { RecurringPayment, Transaction } from '../types/finance';
import { getTransactionAmount } from './analytics';

export type RecurringRisk = 'low' | 'medium' | 'high';

export type RecurringPaymentAudit = {
  id: string;
  title: string;
  category: string;
  totalAmount: number;
  averageAmount: number;
  count: number;
  dates: string[];
  risk: RecurringRisk;
  reason: string;
  monthlyEstimate: number;
  source: 'recurring_payments' | 'transactions';
  nextPaymentDate?: string | null;
  isActive?: boolean | null;
};

export type RecurringAuditSummary = {
  payments: RecurringPaymentAudit[];
  totalMonthlyEstimate: number;
  subscriptionCount: number;
  highRiskCount: number;
  potentialSaving: number;
};

const subscriptionKeywords = [
  'подписк',
  'subscription',
  'netflix',
  'spotify',
  'icloud',
  'apple music',
  'apple',
  'google one',
  'youtube premium',
  'youtube',
  'yandex plus',
  'яндекс плюс',
  'кинопоиск',
  'chatgpt',
  'openai',
  'telegram premium',
  'prime',
  'adobe',
  'figma',
  'notion',
];

const normalizeText = (value: unknown) => {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getShortTitle = (transaction: Transaction) => {
  const note = normalizeText(transaction.note);
  const category = normalizeText(transaction.categories?.name);
  const keyword = subscriptionKeywords.find((item) => note.includes(normalizeText(item)));

  if (keyword) {
    if (keyword.includes('яндекс') || keyword.includes('yandex')) return 'Яндекс Плюс';
    if (keyword.includes('netflix')) return 'Netflix';
    if (keyword.includes('spotify')) return 'Spotify';
    if (keyword.includes('icloud')) return 'iCloud';
    if (keyword.includes('youtube')) return 'YouTube Premium';
    if (keyword.includes('telegram')) return 'Telegram Premium';
    if (keyword.includes('chatgpt') || keyword.includes('openai')) return 'ChatGPT';
    if (keyword.includes('google one')) return 'Google One';
    if (keyword.includes('apple')) return 'Apple сервисы';
    if (keyword.includes('adobe')) return 'Adobe';
    if (keyword.includes('figma')) return 'Figma';
    if (keyword.includes('notion')) return 'Notion';

    return keyword;
  }

  if (category.includes('подпис')) return transaction.note || 'Подписка';

  return transaction.note || transaction.categories?.name || 'Повторяющийся расход';
};

const isSubscriptionLike = (transaction: Transaction) => {
  const text = normalizeText(
    `${transaction.note || ''} ${transaction.categories?.name || ''} ${transaction.tags || ''}`,
  );

  return subscriptionKeywords.some((keyword) => text.includes(normalizeText(keyword)));
};

const getTransactionBasedSubscriptions = (transactions: Transaction[]): RecurringPaymentAudit[] => {
  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .map((transaction) => ({
      transaction,
      amount: getTransactionAmount(transaction),
      title: getShortTitle(transaction),
    }))
    .filter((item) => item.amount > 0);

  const groups = new Map<
    string,
    Array<{
      transaction: Transaction;
      amount: number;
      title: string;
    }>
  >();

  expenses.forEach((item) => {
    const key = normalizeText(item.title || item.transaction.note || item.transaction.categories?.name);

    if (!key) return;

    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const amounts = items.map((item) => item.amount);
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const averageAmount = Math.round(totalAmount / Math.max(1, items.length));
      const hasSubscriptionKeyword = items.some((item) => isSubscriptionLike(item.transaction));
      const isRecurring = hasSubscriptionKeyword || items.length >= 2;

      if (!isRecurring) return null;

      let risk: RecurringRisk = 'low';
      let reason = 'Платёж похож на регулярный расход.';

      if (hasSubscriptionKeyword && averageAmount >= 5000) {
        risk = 'high';
        reason = 'Дорогая подписка или регулярный сервис. Стоит проверить необходимость.';
      } else if (hasSubscriptionKeyword || averageAmount >= 3000) {
        risk = 'medium';
        reason = 'Регулярный платёж, который может незаметно увеличивать расходы.';
      }

      return {
        id: `tx-${key}`,
        title: items[0]?.title || 'Повторяющийся расход',
        category: items[0]?.transaction.categories?.name || 'Без категории',
        totalAmount,
        averageAmount,
        count: items.length,
        dates: items
          .map((item) => item.transaction.transaction_date || '')
          .filter(Boolean)
          .sort(),
        risk,
        reason,
        monthlyEstimate: averageAmount,
        source: 'transactions',
      } satisfies RecurringPaymentAudit;
    })
    .filter(Boolean) as RecurringPaymentAudit[];
};

const getRecurringPaymentRows = (recurringPayments: RecurringPayment[]): RecurringPaymentAudit[] => {
  return (recurringPayments || [])
    .filter((payment) => payment.is_active !== false)
    .map((payment) => {
      const amount = Number(payment.amount);

      if (!Number.isFinite(amount) || amount <= 0) return null;

      let risk: RecurringRisk = 'low';
      let reason = 'Активная подписка из раздела регулярных платежей.';

      if (amount >= 5000) {
        risk = 'high';
        reason = 'Высокая ежемесячная нагрузка. Стоит проверить, используется ли подписка.';
      } else if (amount >= 2500) {
        risk = 'medium';
        reason = 'Средняя регулярная нагрузка на бюджет.';
      }

      return {
        id: `rp-${payment.id}`,
        title: payment.title || 'Подписка',
        category: 'Регулярные платежи',
        totalAmount: amount,
        averageAmount: amount,
        count: 1,
        dates: payment.next_payment_date ? [payment.next_payment_date] : [],
        risk,
        reason,
        monthlyEstimate: amount,
        source: 'recurring_payments',
        nextPaymentDate: payment.next_payment_date,
        isActive: payment.is_active,
      } satisfies RecurringPaymentAudit;
    })
    .filter(Boolean) as RecurringPaymentAudit[];
};

export const buildRecurringAudit = (
  transactions: Transaction[],
  recurringPayments: RecurringPayment[] = [],
): RecurringAuditSummary => {
  const fromRecurringPayments = getRecurringPaymentRows(recurringPayments);
  const fromTransactions = getTransactionBasedSubscriptions(transactions);

  const existingTitles = new Set(
    fromRecurringPayments.map((payment) => normalizeText(payment.title)),
  );

  const uniqueTransactionBased = fromTransactions.filter(
    (payment) => !existingTitles.has(normalizeText(payment.title)),
  );

  const sortedPayments = [...fromRecurringPayments, ...uniqueTransactionBased].sort((a, b) => {
    const riskWeight = { high: 3, medium: 2, low: 1 };

    return riskWeight[b.risk] - riskWeight[a.risk] || b.monthlyEstimate - a.monthlyEstimate;
  });

  const totalMonthlyEstimate = sortedPayments.reduce(
    (sum, item) => sum + item.monthlyEstimate,
    0,
  );

  const highRiskCount = sortedPayments.filter((item) => item.risk === 'high').length;

  const potentialSaving = sortedPayments.reduce((sum, item) => {
    if (item.risk === 'high') return sum + Math.round(item.monthlyEstimate * 0.7);
    if (item.risk === 'medium') return sum + Math.round(item.monthlyEstimate * 0.4);

    return sum;
  }, 0);

  return {
    payments: sortedPayments,
    totalMonthlyEstimate,
    subscriptionCount: sortedPayments.length,
    highRiskCount,
    potentialSaving,
  };
};

export const getRecurringAuditConclusion = (summary: RecurringAuditSummary) => {
  if (summary.subscriptionCount === 0) {
    return 'Активные подписки и повторяющиеся расходы не найдены.';
  }

  if (summary.highRiskCount > 0) {
    return `Найдено ${summary.highRiskCount} регулярных платежей с высоким риском. Потенциальная экономия может составить около ${summary.potentialSaving.toLocaleString('ru-KZ')} ₸.`;
  }

  if (summary.totalMonthlyEstimate > 0) {
    return `Регулярные платежи дают нагрузку около ${summary.totalMonthlyEstimate.toLocaleString('ru-KZ')} ₸ в месяц. Их стоит проверять раз в месяц.`;
  }

  return 'Регулярные расходы выглядят умеренными.';
};
