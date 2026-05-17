import { Transaction } from '../types/finance';
import { getTransactionAmount } from './analytics';

export type CashflowDay = {
  date: string;
  day: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  topCategory: string;
  tone: 'empty' | 'good' | 'normal' | 'warning' | 'danger';
};

export type CashflowSummary = {
  days: CashflowDay[];
  totalIncome: number;
  totalExpense: number;
  bestDay: CashflowDay | null;
  worstDay: CashflowDay | null;
  noSpendDays: number;
  activeDays: number;
  averageExpensePerActiveDay: number;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getDaysInRange = (start: Date, end: Date) => {
  const days: CashflowDay[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor < final) {
    days.push({
      date: toDateKey(cursor),
      day: cursor.getDate(),
      income: 0,
      expense: 0,
      balance: 0,
      transactionCount: 0,
      topCategory: '—',
      tone: 'empty',
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const getTone = ({
  income,
  expense,
  averageExpense,
}: {
  income: number;
  expense: number;
  averageExpense: number;
}): CashflowDay['tone'] => {
  if (income === 0 && expense === 0) return 'empty';
  if (income > expense) return 'good';
  if (averageExpense > 0 && expense >= averageExpense * 2) return 'danger';
  if (averageExpense > 0 && expense >= averageExpense * 1.35) return 'warning';

  return 'normal';
};

export const buildCashflowCalendar = ({
  transactions,
  periodStart,
  periodEnd,
}: {
  transactions: Transaction[];
  periodStart: Date;
  periodEnd: Date;
}): CashflowSummary => {
  const days = getDaysInRange(periodStart, periodEnd);
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const categoryByDay = new Map<string, Map<string, number>>();

  transactions.forEach((transaction) => {
    if (!transaction.transaction_date) return;

    const date = new Date(transaction.transaction_date);

    if (Number.isNaN(date.getTime())) return;

    const key = toDateKey(date);
    const day = dayMap.get(key);

    if (!day) return;

    const amount = getTransactionAmount(transaction);

    if (transaction.type === 'income') {
      day.income += amount;
    }

    if (transaction.type === 'expense') {
      day.expense += amount;

      const categoryName = transaction.categories?.name || 'Без категории';
      const current = categoryByDay.get(key) || new Map<string, number>();
      current.set(categoryName, (current.get(categoryName) || 0) + amount);
      categoryByDay.set(key, current);
    }

    day.balance = day.income - day.expense;
    day.transactionCount += 1;
  });

  const totalIncome = days.reduce((sum, day) => sum + day.income, 0);
  const totalExpense = days.reduce((sum, day) => sum + day.expense, 0);
  const activeExpenseDays = days.filter((day) => day.expense > 0);
  const averageExpensePerActiveDay =
    activeExpenseDays.length > 0
      ? Math.round(totalExpense / activeExpenseDays.length)
      : 0;

  days.forEach((day) => {
    const categories = categoryByDay.get(day.date);

    if (categories && categories.size > 0) {
      const [topCategory] = Array.from(categories.entries()).sort((a, b) => b[1] - a[1])[0];
      day.topCategory = topCategory;
    }

    day.tone = getTone({
      income: day.income,
      expense: day.expense,
      averageExpense: averageExpensePerActiveDay,
    });
  });

  const spendDays = days.filter((day) => day.expense > 0);
  const incomeDays = days.filter((day) => day.income > 0);

  const worstDay =
    spendDays.length > 0
      ? [...spendDays].sort((a, b) => b.expense - a.expense)[0]
      : null;

  const bestDay =
    incomeDays.length > 0
      ? [...incomeDays].sort((a, b) => b.balance - a.balance)[0]
      : null;

  return {
    days,
    totalIncome,
    totalExpense,
    bestDay,
    worstDay,
    noSpendDays: days.filter((day) => day.expense === 0).length,
    activeDays: days.filter((day) => day.transactionCount > 0).length,
    averageExpensePerActiveDay,
  };
};
