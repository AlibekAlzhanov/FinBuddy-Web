export type TransactionType = 'income' | 'expense' | 'transfer' | string;

export type Account = {
  id: string;
  name: string | null;
  currency_code?: string | null;
  currency?: string | null;
};

export type Category = {
  id: string;
  name: string | null;
  type: TransactionType | null;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType | null;
  amount: number | string | null;
  base_amount?: number | string | null;
  original_amount?: number | string | null;
  transaction_date: string | null;
  category_id: string | null;
  account_id?: string | null;
  note: string | null;
  tags?: string[] | string | null;
  categories?: {
    id?: string;
    name: string | null;
    type?: TransactionType | null;
  } | null;
  accounts?: {
    id: string;
    name: string | null;
    currency_code?: string | null;
  } | null;
};

export type Budget = {
  id: string;
  category_id: string | null;
  limit_amount: number | string | null;
  period?: string | null;
};

export type Goal = {
  id: string;
  title: string | null;
  target_amount: number | string | null;
  current_amount: number | string | null;
  deadline?: string | null;
};

export type RecurringPayment = {
  id: string;
  title: string | null;
  amount: number | string | null;
  account_id?: string | null;
  category_id?: string | null;
  next_payment_date: string | null;
  start_date?: string | null;
  frequency?: string | null;
  is_active?: boolean | null;
  note?: string | null;
};

export type PeriodOption = 'current' | 'previous' | 'march' | 'april' | 'custom';

export type ScoreFactor = {
  id: string;
  title: string;
  impact: number;
  description: string;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percent: number;
  status: 'normal' | 'warning' | 'exceeded';
};

export type GoalStatus = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number;
  deadline: string | null;
};

export type DashboardMetrics = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensePercent: number;
  savingRate: number;
  transactionCount: number;
  averageDailyExpense: number;
  forecastExpense: number;
  forecastDiff: number;
  dailySafeLimit: number;
  financialScore: number;
  financialScoreLabel: string;
  scoreFactors: ScoreFactor[];
  budgetStatuses: BudgetStatus[];
  goalStatuses: GoalStatus[];
};

export type CategorySummary = {
  id: string;
  name: string;
  amount: number;
  count: number;
  percent: number;
};
