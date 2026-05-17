import { DashboardMetrics } from '../types/finance';
import { formatKzt } from './format';

export const getPreviousRange = (start: Date) => {
  const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const previousEnd = new Date(start.getFullYear(), start.getMonth(), 1);

  return {
    start: previousStart,
    end: previousEnd,
  };
};

export const getChangePercent = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;

  return Math.round(((current - previous) / previous) * 100);
};

export const getChangeText = (current: number, previous: number) => {
  const change = getChangePercent(current, previous);

  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;

  return '0%';
};

export const buildComparisonData = (
  current: DashboardMetrics,
  previous: DashboardMetrics,
) => {
  return [
    {
      name: 'Доходы',
      current: current.totalIncome,
      previous: previous.totalIncome,
    },
    {
      name: 'Расходы',
      current: current.totalExpense,
      previous: previous.totalExpense,
    },
    {
      name: 'Баланс',
      current: current.balance,
      previous: previous.balance,
    },
  ];
};

export const buildComparisonSummary = (
  current: DashboardMetrics,
  previous: DashboardMetrics,
) => {
  const expenseChange = getChangePercent(current.totalExpense, previous.totalExpense);
  const incomeChange = getChangePercent(current.totalIncome, previous.totalIncome);

  if (current.transactionCount === 0) {
    return 'Нет данных за текущий период для сравнения.';
  }

  if (previous.transactionCount === 0) {
    return 'За прошлый месяц нет данных, поэтому сравнение ограничено текущим периодом.';
  }

  if (expenseChange > 15 && incomeChange <= 5) {
    return `Расходы выросли на ${expenseChange}%, а доходы почти не изменились. Это зона риска.`;
  }

  if (expenseChange < -10) {
    return `Расходы снизились на ${Math.abs(expenseChange)}%. Это положительная динамика.`;
  }

  if (current.balance > previous.balance) {
    return `Баланс улучшился: сейчас ${formatKzt(current.balance)}, прошлый период — ${formatKzt(previous.balance)}.`;
  }

  return 'Финансовая динамика без резких изменений. Следите за крупными категориями расходов.';
};
