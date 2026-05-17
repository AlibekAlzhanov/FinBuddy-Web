import { CategorySummary, DashboardMetrics } from '../types/finance';

export type PlannerScenarioId = 'soft' | 'balanced' | 'strict';

export type PlannerScenario = {
  id: PlannerScenarioId;
  title: string;
  description: string;
  cutPercent: number;
};

export type CategorySavingPlan = {
  id: string;
  name: string;
  currentAmount: number;
  recommendedLimit: number;
  savingPotential: number;
  percent: number;
};

export type BudgetPlanResult = {
  targetSaving: number;
  currentSaving: number;
  missingSaving: number;
  projectedSaving: number;
  projectedBalance: number;
  dailyLimit: number;
  savingPotential: number;
  isTargetReached: boolean;
  categoryPlans: CategorySavingPlan[];
};

export const plannerScenarios: PlannerScenario[] = [
  {
    id: 'soft',
    title: 'Мягкий режим',
    description: 'Сократить только необязательные категории без сильных ограничений.',
    cutPercent: 8,
  },
  {
    id: 'balanced',
    title: 'Сбалансированный режим',
    description: 'Оптимальный режим: заметная экономия без жёсткого контроля.',
    cutPercent: 15,
  },
  {
    id: 'strict',
    title: 'Жёсткий режим',
    description: 'Максимальная экономия на категориях риска до конца периода.',
    cutPercent: 25,
  },
];

const getRemainingDaysInPeriod = (periodEnd: Date) => {
  const now = new Date();

  if (now >= periodEnd) return 0;

  return Math.max(
    1,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  );
};

const getScenario = (scenarioId: PlannerScenarioId) => {
  return plannerScenarios.find((scenario) => scenario.id === scenarioId) || plannerScenarios[1];
};

const isOptimizableCategory = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();

  const protectedKeywords = [
    'зарплата',
    'доход',
    'перевод',
    'долг',
    'аренда',
    'кредит',
    'коммун',
    'здоров',
    'лекар',
  ];

  return !protectedKeywords.some((keyword) => normalized.includes(keyword));
};

export const buildBudgetPlan = ({
  metrics,
  categories,
  periodEnd,
  targetSaving,
  scenarioId,
}: {
  metrics: DashboardMetrics;
  categories: CategorySummary[];
  periodEnd: Date;
  targetSaving: number;
  scenarioId: PlannerScenarioId;
}): BudgetPlanResult => {
  const scenario = getScenario(scenarioId);
  const remainingDays = getRemainingDaysInPeriod(periodEnd);

  const optimizableCategories = categories
    .filter((category) => category.amount > 0 && isOptimizableCategory(category.name))
    .slice(0, 8);

  const categoryPlans: CategorySavingPlan[] = optimizableCategories.map((category) => {
    const savingPotential = Math.round((category.amount * scenario.cutPercent) / 100);
    const recommendedLimit = Math.max(0, category.amount - savingPotential);

    return {
      id: category.id,
      name: category.name,
      currentAmount: category.amount,
      recommendedLimit,
      savingPotential,
      percent: category.percent,
    };
  });

  const savingPotential = categoryPlans.reduce(
    (sum, category) => sum + category.savingPotential,
    0,
  );

  const currentSaving = metrics.balance;
  const projectedSaving = currentSaving + savingPotential;
  const projectedBalance = projectedSaving;
  const missingSaving = Math.max(0, targetSaving - projectedSaving);

  const safeRemainingSpend = Math.max(
    0,
    metrics.totalIncome - metrics.totalExpense - targetSaving,
  );

  const dailyLimit =
    remainingDays > 0
      ? Math.max(0, Math.floor(safeRemainingSpend / remainingDays))
      : 0;

  return {
    targetSaving,
    currentSaving,
    missingSaving,
    projectedSaving,
    projectedBalance,
    dailyLimit,
    savingPotential,
    isTargetReached: projectedSaving >= targetSaving,
    categoryPlans,
  };
};

export const getSuggestedTargetSaving = (metrics: DashboardMetrics) => {
  if (metrics.totalIncome <= 0) return 0;

  const twentyPercent = Math.round(metrics.totalIncome * 0.2);

  if (metrics.balance > twentyPercent) {
    return Math.round(metrics.balance);
  }

  return twentyPercent;
};

export const getPlannerConclusion = (plan: BudgetPlanResult) => {
  if (plan.targetSaving <= 0) {
    return 'Укажите цель накопления, чтобы FinBuddy рассчитал план сокращения расходов.';
  }

  if (plan.isTargetReached) {
    return 'Цель достижима при выбранном сценарии. Главное — придерживаться рекомендованных лимитов по категориям.';
  }

  if (plan.savingPotential > 0) {
    return 'Цель пока не полностью достижима. Нужно либо усилить сценарий экономии, либо снизить целевой остаток.';
  }

  return 'Для построения плана недостаточно оптимизируемых категорий расходов.';
};
