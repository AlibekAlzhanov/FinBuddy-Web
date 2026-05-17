import {
  Budget,
  BudgetStatus,
  Category,
  CategorySummary,
  DashboardMetrics,
  Goal,
  GoalStatus,
  RecurringPayment,
  ScoreFactor,
  Transaction,
} from '../types/finance';
import { safeNumber } from './format';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const startOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const daysBetween = (start: Date, end: Date) => {
  const startDay = startOfDay(start).getTime();
  const endDay = startOfDay(end).getTime();

  return Math.max(1, Math.ceil((endDay - startDay) / MS_IN_DAY));
};

const isValidDate = (value: unknown) => {
  if (!value) return false;

  const date = new Date(String(value));

  return !Number.isNaN(date.getTime());
};

const getFinancialScoreLabel = (score: number) => {
  if (score >= 80) return 'Финансы под контролем';
  if (score >= 60) return 'Стабильно, но есть зоны роста';
  if (score >= 40) return 'Нужно усилить контроль';

  return 'Высокий риск перерасхода';
};

export const getTransactionAmount = (transaction: Transaction) => {
  return safeNumber(transaction.base_amount ?? transaction.amount);
};

export const calculateBudgetStatuses = ({
  budgets,
  categories,
  categorySummary,
}: {
  budgets: Budget[];
  categories: Category[];
  categorySummary: CategorySummary[];
}): BudgetStatus[] => {
  const categoryNameById = new Map<string, string>();

  categories.forEach((category) => {
    categoryNameById.set(category.id, category.name || 'Категория');
  });

  const spentByCategory = new Map<string, number>();

  categorySummary.forEach((category) => {
    spentByCategory.set(category.id, category.amount);
  });

  return (budgets || [])
    .map((budget) => {
      const categoryId = budget.category_id || 'unknown';
      const limitAmount = safeNumber(budget.limit_amount);
      const spentAmount = spentByCategory.get(categoryId) || 0;
      const percent = limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;

      let status: BudgetStatus['status'] = 'normal';

      if (percent >= 100) status = 'exceeded';
      else if (percent >= 80) status = 'warning';

      return {
        id: budget.id || `budget-${categoryId}`,
        categoryId,
        categoryName: categoryNameById.get(categoryId) || 'Категория',
        limitAmount,
        spentAmount,
        remainingAmount: Math.max(limitAmount - spentAmount, 0),
        percent,
        status,
      };
    })
    .filter((budget) => budget.limitAmount > 0);
};

export const calculateGoalStatuses = (goals: Goal[]): GoalStatus[] => {
  return (goals || [])
    .map((goal) => {
      const targetAmount = safeNumber(goal.target_amount);
      const currentAmount = safeNumber(goal.current_amount);
      const progress =
        targetAmount > 0 ? clamp(Math.round((currentAmount / targetAmount) * 100), 0, 100) : 0;

      return {
        id: goal.id || `goal-${goal.title || 'unknown'}`,
        title: goal.title || 'Финансовая цель',
        targetAmount,
        currentAmount,
        remainingAmount: Math.max(targetAmount - currentAmount, 0),
        progress,
        deadline: goal.deadline || null,
      };
    })
    .filter((goal) => goal.targetAmount > 0);
};

const getUpcomingSubscriptionsAmount = ({
  recurringPayments,
  today,
  periodEnd,
}: {
  recurringPayments: RecurringPayment[];
  today: Date;
  periodEnd: Date;
}) => {
  return (recurringPayments || [])
    .filter((payment) => payment.is_active !== false)
    .filter((payment) => isValidDate(payment.next_payment_date))
    .filter((payment) => {
      const nextPayment = new Date(String(payment.next_payment_date));

      return nextPayment >= startOfDay(today) && nextPayment < periodEnd;
    })
    .reduce((sum, payment) => sum + safeNumber(payment.amount), 0);
};

const detectAnomalyCount = (transactions: Transaction[]) => {
  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .map((transaction) => getTransactionAmount(transaction))
    .filter((amount) => amount > 0);

  if (expenses.length === 0) return 0;

  const average = expenses.reduce((sum, amount) => sum + amount, 0) / expenses.length;

  return expenses.filter((amount) => amount >= average * 2).length;
};

const calculateFinancialScore = ({
  totalIncome,
  totalExpense,
  forecastExpense,
  savingRate,
  anomaliesCount,
  topExpenseCategories,
  budgetStatuses,
  goalStatuses,
}: {
  totalIncome: number;
  totalExpense: number;
  forecastExpense: number;
  savingRate: number;
  anomaliesCount: number;
  topExpenseCategories: CategorySummary[];
  budgetStatuses: BudgetStatus[];
  goalStatuses: GoalStatus[];
}) => {
  let score = 50;
  const factors: ScoreFactor[] = [];

  if (totalIncome > totalExpense) {
    score += 20;
    factors.push({
      id: 'income-above-expense',
      title: 'Доходы выше расходов',
      impact: 20,
      description: 'За выбранный период доходы превышают расходы.',
    });
  } else if (totalExpense > 0) {
    score -= 20;
    factors.push({
      id: 'expense-above-income',
      title: 'Расходы выше доходов',
      impact: -20,
      description: 'Расходы превышают доходы или доходы не указаны.',
    });
  }

  if (totalIncome > 0 && forecastExpense <= totalIncome) {
    score += 15;
    factors.push({
      id: 'forecast-safe',
      title: 'Прогноз в пределах дохода',
      impact: 15,
      description: 'При текущем темпе расходы не должны превысить доход.',
    });
  } else if (totalIncome > 0 && forecastExpense > totalIncome) {
    score -= 15;
    factors.push({
      id: 'forecast-risk',
      title: 'Риск перерасхода',
      impact: -15,
      description: 'Прогноз расходов выше дохода за период.',
    });
  }

  if (savingRate >= 20) {
    score += 15;
    factors.push({
      id: 'good-saving-rate',
      title: 'Хороший уровень накопления',
      impact: 15,
      description: 'Свободный остаток составляет 20% или больше.',
    });
  } else if (savingRate < 5 && totalIncome > 0) {
    score -= 10;
    factors.push({
      id: 'low-saving-rate',
      title: 'Низкий свободный остаток',
      impact: -10,
      description: 'После расходов остаётся слишком мало денег.',
    });
  }

  if (anomaliesCount === 0) {
    score += 5;
    factors.push({
      id: 'no-anomalies',
      title: 'Нет явных аномалий',
      impact: 5,
      description: 'Крупные необычные расходы не обнаружены.',
    });
  } else if (anomaliesCount >= 3) {
    score -= 10;
    factors.push({
      id: 'many-anomalies',
      title: 'Несколько аномальных расходов',
      impact: -10,
      description: 'Обнаружено несколько расходов выше обычного уровня.',
    });
  }

  const topCategory = topExpenseCategories[0];

  if (topCategory && topCategory.percent >= 50) {
    score -= 10;
    factors.push({
      id: 'category-concentration-high',
      title: 'Сильная зависимость от одной категории',
      impact: -10,
      description: `Категория «${topCategory.name}» занимает ${topCategory.percent}% расходов.`,
    });
  } else if (topCategory && topCategory.percent >= 35) {
    score -= 5;
    factors.push({
      id: 'category-concentration-medium',
      title: 'Одна категория занимает большую долю',
      impact: -5,
      description: `Категория «${topCategory.name}» занимает ${topCategory.percent}% расходов.`,
    });
  }

  const exceededBudgets = budgetStatuses.filter((budget) => budget.status === 'exceeded');
  const warningBudgets = budgetStatuses.filter((budget) => budget.status === 'warning');

  if (exceededBudgets.length > 0) {
    score -= 10;
    factors.push({
      id: 'budget-exceeded',
      title: 'Есть превышенные бюджеты',
      impact: -10,
      description: `Превышены лимиты: ${exceededBudgets
        .map((budget) => budget.categoryName)
        .join(', ')}.`,
    });
  } else if (budgetStatuses.length > 0 && warningBudgets.length === 0) {
    score += 5;
    factors.push({
      id: 'budgets-normal',
      title: 'Бюджеты под контролем',
      impact: 5,
      description: 'Лимиты по категориям не превышены.',
    });
  }

  const activeGoals = goalStatuses.filter((goal) => goal.progress < 100);

  if (activeGoals.length > 0) {
    score += 5;
    factors.push({
      id: 'active-goals',
      title: 'Есть активные финансовые цели',
      impact: 5,
      description: 'Пользователь ведёт накопления и отслеживает прогресс.',
    });
  }

  const normalizedScore = clamp(Math.round(score), 0, 100);

  return {
    score: normalizedScore,
    label: getFinancialScoreLabel(normalizedScore),
    factors,
  };
};

export const buildDashboardMetrics = (
  transactions: Transaction[],
  periodStart: Date,
  periodEnd: Date,
  options?: {
    categories?: Category[];
    budgets?: Budget[];
    goals?: Goal[];
    recurringPayments?: RecurringPayment[];
  },
): DashboardMetrics => {
  const income = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + getTransactionAmount(tx), 0);

  const expense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + getTransactionAmount(tx), 0);

  const balance = income - expense;
  const expensePercent = income > 0 ? Math.round((expense / income) * 100) : expense > 0 ? 100 : 0;
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const now = new Date();
  const isCurrentPeriod = now >= periodStart && now < periodEnd;
  const periodDays = daysBetween(periodStart, periodEnd);
  const daysPassed = isCurrentPeriod
    ? clamp(daysBetween(periodStart, new Date(startOfDay(now).getTime() + MS_IN_DAY)), 1, periodDays)
    : periodDays;

  const averageDailyExpense = daysPassed > 0 ? Math.round(expense / daysPassed) : 0;
  const upcomingSubscriptionsAmount = getUpcomingSubscriptionsAmount({
    recurringPayments: options?.recurringPayments || [],
    today: now,
    periodEnd,
  });

  const forecastExpense = isCurrentPeriod
    ? Math.max(expense, Math.round(averageDailyExpense * periodDays + upcomingSubscriptionsAmount))
    : expense;

  const forecastDiff = forecastExpense - income;
  const remainingDays = isCurrentPeriod ? Math.max(1, daysBetween(now, periodEnd)) : periodDays;
  const dailySafeLimit = isCurrentPeriod
    ? Math.max(0, Math.round((income - expense - upcomingSubscriptionsAmount) / remainingDays))
    : Math.max(0, Math.round((income - expense) / periodDays));

  const categorySummary = buildCategorySummary(transactions, options?.categories || []);
  const budgetStatuses = calculateBudgetStatuses({
    budgets: options?.budgets || [],
    categories: options?.categories || [],
    categorySummary,
  });
  const goalStatuses = calculateGoalStatuses(options?.goals || []);
  const anomaliesCount = detectAnomalyCount(transactions);

  const score = calculateFinancialScore({
    totalIncome: income,
    totalExpense: expense,
    forecastExpense,
    savingRate,
    anomaliesCount,
    topExpenseCategories: categorySummary,
    budgetStatuses,
    goalStatuses,
  });

  return {
    totalIncome: income,
    totalExpense: expense,
    balance,
    expensePercent,
    savingRate,
    transactionCount: transactions.length,
    averageDailyExpense,
    forecastExpense,
    forecastDiff,
    dailySafeLimit,
    financialScore: score.score,
    financialScoreLabel: score.label,
    scoreFactors: score.factors,
    budgetStatuses,
    goalStatuses,
  };
};

export const buildCategorySummary = (
  transactions: Transaction[],
  categories: Category[],
): CategorySummary[] => {
  const categoryMap = new Map<string, string>();

  categories.forEach((category) => {
    categoryMap.set(category.id, category.name || 'Без категории');
  });

  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  const totalExpense = expenseTransactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0,
  );

  const grouped = new Map<string, CategorySummary>();

  expenseTransactions.forEach((transaction) => {
    const id = transaction.category_id || 'unknown';
    const name =
      transaction.categories?.name ||
      categoryMap.get(id) ||
      'Без категории';

    const current =
      grouped.get(id) ||
      ({
        id,
        name,
        amount: 0,
        count: 0,
        percent: 0,
      } satisfies CategorySummary);

    current.amount += getTransactionAmount(transaction);
    current.count += 1;

    grouped.set(id, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      percent: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const buildDailyChartData = (transactions: Transaction[]) => {
  const grouped = new Map<
    string,
    {
      date: string;
      income: number;
      expense: number;
    }
  >();

  transactions.forEach((transaction) => {
    if (!transaction.transaction_date) return;

    const date = new Date(transaction.transaction_date);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    const current =
      grouped.get(key) ||
      ({
        date: key,
        income: 0,
        expense: 0,
      } satisfies { date: string; income: number; expense: number });

    if (transaction.type === 'income') {
      current.income += getTransactionAmount(transaction);
    }

    if (transaction.type === 'expense') {
      current.expense += getTransactionAmount(transaction);
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      label: new Date(item.date).toLocaleDateString('ru-KZ', {
        day: '2-digit',
        month: 'short',
      }),
    }));
};

export const getAiSummaryText = (
  metrics: DashboardMetrics,
  categories: CategorySummary[],
) => {
  const topCategory = categories[0];

  if (metrics.transactionCount === 0) {
    return 'Добавьте операции за выбранный период, чтобы FinBuddy сформировал аналитику.';
  }

  if (metrics.totalIncome <= 0 && metrics.totalExpense > 0) {
    return 'За период есть расходы, но нет доходов. Добавьте доходы или выберите другой период.';
  }

  if (metrics.forecastDiff > 0) {
    return `При текущем темпе есть риск перерасхода: прогноз выше дохода на ${metrics.forecastDiff.toLocaleString('ru-KZ')} ₸.`;
  }

  if (metrics.expensePercent >= 100) {
    return `Расходы превышают доходы. Главная зона риска: ${topCategory?.name || 'категории расходов'}.`;
  }

  if (metrics.expensePercent >= 80) {
    return `Расходы занимают ${metrics.expensePercent}% дохода. Стоит ограничить категорию “${topCategory?.name || 'главная категория'}”.`;
  }

  if (topCategory) {
    return `Главная статья расходов — “${topCategory.name}”. На неё приходится ${topCategory.percent}% расходов.`;
  }

  return 'Финансовая ситуация выглядит стабильной. Продолжайте отслеживать расходы.';
};
