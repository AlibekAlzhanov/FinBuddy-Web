import { CategorySummary, DashboardMetrics, Transaction } from '../types/finance';
import { getChangePercent } from './compare';
import { formatKzt } from './format';
import { getTransactionAmount } from './analytics';

export type RiskTone = 'good' | 'normal' | 'warning' | 'danger';

export type ForecastInsight = {
  tone: RiskTone;
  title: string;
  description: string;
  safeDailySpend: number;
  remainingDays: number;
  remainingBalance: number;
};

export type SpendingAnomaly = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string | null;
  reason: string;
};

export type CategoryRisk = {
  id: string;
  name: string;
  amount: number;
  percent: number;
  changePercent: number;
  tone: RiskTone;
  comment: string;
};

export type SmartRecommendation = {
  title: string;
  description: string;
  tone: RiskTone;
};

const getRemainingDaysInPeriod = (periodEnd: Date) => {
  const now = new Date();

  if (now >= periodEnd) return 0;

  return Math.max(
    1,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  );
};

export const buildForecastInsight = ({
  metrics,
  periodEnd,
}: {
  metrics: DashboardMetrics;
  periodEnd: Date;
}): ForecastInsight => {
  const remainingDays = getRemainingDaysInPeriod(periodEnd);
  const remainingBalance = metrics.totalIncome - metrics.forecastExpense;
  const safeDailySpend =
    remainingDays > 0
      ? Math.max(0, Math.floor((metrics.totalIncome - metrics.totalExpense) / remainingDays))
      : 0;

  if (metrics.totalIncome <= 0 && metrics.totalExpense > 0) {
    return {
      tone: 'danger',
      title: 'Нет доходов для прогноза',
      description:
        'За период есть расходы, но доходы не добавлены. Прогноз может быть некорректным.',
      safeDailySpend,
      remainingDays,
      remainingBalance,
    };
  }

  if (metrics.forecastExpense > metrics.totalIncome) {
    return {
      tone: 'danger',
      title: 'Прогноз показывает перерасход',
      description: `Если темп расходов сохранится, расходы могут превысить доходы примерно на ${formatKzt(Math.abs(remainingBalance))}.`,
      safeDailySpend,
      remainingDays,
      remainingBalance,
    };
  }

  if (metrics.expensePercent >= 80) {
    return {
      tone: 'warning',
      title: 'Расходы близки к опасной зоне',
      description:
        'Расходы занимают большую часть дохода. До конца периода лучше ограничить необязательные покупки.',
      safeDailySpend,
      remainingDays,
      remainingBalance,
    };
  }

  if (metrics.savingRate >= 25) {
    return {
      tone: 'good',
      title: 'Прогноз выглядит устойчиво',
      description:
        'Доходы покрывают текущий темп расходов, есть потенциал для накоплений или финансовой цели.',
      safeDailySpend,
      remainingDays,
      remainingBalance,
    };
  }

  return {
    tone: 'normal',
    title: 'Финансовая динамика нормальная',
    description:
      'Критического риска нет, но крупнейшие категории расходов лучше держать под контролем.',
    safeDailySpend,
    remainingDays,
    remainingBalance,
  };
};

export const detectSpendingAnomalies = (transactions: Transaction[]): SpendingAnomaly[] => {
  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .map((transaction) => ({
      transaction,
      amount: getTransactionAmount(transaction),
    }))
    .filter((item) => item.amount > 0);

  if (expenses.length === 0) return [];

  const average =
    expenses.reduce((sum, item) => sum + item.amount, 0) / expenses.length;

  const threshold = Math.max(average * 1.8, 10000);

  return expenses
    .filter((item) => item.amount >= threshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(({ transaction, amount }) => ({
      id: transaction.id,
      title: transaction.note || 'Крупный расход',
      amount,
      category: transaction.categories?.name || 'Без категории',
      date: transaction.transaction_date,
      reason:
        amount >= average * 2.5
          ? 'Сильно выше среднего расхода'
          : 'Выше обычного уровня расходов',
    }));
};

export const buildCategoryRisks = ({
  categories,
  previousCategories,
}: {
  categories: CategorySummary[];
  previousCategories: CategorySummary[];
}): CategoryRisk[] => {
  return categories.slice(0, 8).map((category) => {
    const previous = previousCategories.find((item) => item.name === category.name);
    const previousAmount = previous?.amount || 0;
    const changePercent = getChangePercent(category.amount, previousAmount);

    let tone: RiskTone = 'normal';
    let comment = 'Категория в пределах обычного уровня.';

    if (category.percent >= 35 || changePercent >= 70) {
      tone = 'danger';
      comment = 'Высокая нагрузка на бюджет. Нужен контроль лимита.';
    } else if (category.percent >= 20 || changePercent >= 30) {
      tone = 'warning';
      comment = 'Категория заметно влияет на расходы.';
    } else if (changePercent < -15) {
      tone = 'good';
      comment = 'Расходы снизились относительно прошлого месяца.';
    }

    return {
      id: category.id,
      name: category.name,
      amount: category.amount,
      percent: category.percent,
      changePercent,
      tone,
      comment,
    };
  });
};

export const buildSmartRecommendations = ({
  metrics,
  categories,
  categoryRisks,
  anomalies,
}: {
  metrics: DashboardMetrics;
  categories: CategorySummary[];
  categoryRisks: CategoryRisk[];
  anomalies: SpendingAnomaly[];
}): SmartRecommendation[] => {
  const recommendations: SmartRecommendation[] = [];
  const topCategory = categories[0];
  const dangerousCategory = categoryRisks.find((category) => category.tone === 'danger');
  const warningCategory = categoryRisks.find((category) => category.tone === 'warning');

  if (metrics.forecastExpense > metrics.totalIncome && metrics.totalIncome > 0) {
    recommendations.push({
      title: 'Снизить темп расходов до конца месяца',
      description: `Прогноз расходов: ${formatKzt(metrics.forecastExpense)}, доходы: ${formatKzt(metrics.totalIncome)}. Нужно сократить необязательные траты.`,
      tone: 'danger',
    });
  }

  if (dangerousCategory) {
    recommendations.push({
      title: `Поставить лимит на “${dangerousCategory.name}”`,
      description: `Категория занимает ${dangerousCategory.percent}% расходов и изменилась на ${dangerousCategory.changePercent}%.`,
      tone: 'danger',
    });
  }

  if (warningCategory && !dangerousCategory) {
    recommendations.push({
      title: `Проверить категорию “${warningCategory.name}”`,
      description:
        'Категория заметно влияет на бюджет. Проверьте последние операции и уберите лишние траты.',
      tone: 'warning',
    });
  }

  if (anomalies.length > 0) {
    recommendations.push({
      title: 'Проверить крупные операции',
      description: `Найдено ${anomalies.length} расходов выше обычного уровня. Они могут искажать бюджет периода.`,
      tone: 'warning',
    });
  }

  if (metrics.savingRate >= 25) {
    recommendations.push({
      title: 'Перенаправить остаток в цель',
      description:
        'Норма накопления хорошая. Можно закрепить результат через перевод части остатка в финансовую цель.',
      tone: 'good',
    });
  }

  if (recommendations.length === 0 && topCategory) {
    recommendations.push({
      title: `Контролировать “${topCategory.name}”`,
      description: `Это крупнейшая категория расходов: ${formatKzt(topCategory.amount)} (${topCategory.percent}%).`,
      tone: 'normal',
    });
  }

  return recommendations.slice(0, 5);
};
