import { AlertTriangle, CheckCircle2, Flag, Gauge, PiggyBank, Target } from 'lucide-react';
import { Budget, CategorySummary, DashboardMetrics, Goal } from '../types/finance';
import { formatDateRu, formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  metrics: DashboardMetrics;
  categories: CategorySummary[];
  budgets: Budget[];
  goals: Goal[];
};

const statusClasses = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  exceeded: 'bg-rose-50 text-rose-700 border-rose-100',
};

const statusLabels = {
  normal: 'В норме',
  warning: 'Почти лимит',
  exceeded: 'Превышен',
};

export default function BudgetGoalsPanel({
  metrics,
  categories,
  budgets,
  goals,
}: Props) {
  const { t } = useLanguage();
  const exceededBudgets = metrics.budgetStatuses.filter((budget) => budget.status === 'exceeded');
  const warningBudgets = metrics.budgetStatuses.filter((budget) => budget.status === 'warning');
  const activeGoals = metrics.goalStatuses.filter((goal) => goal.progress < 100);
  const completedGoals = metrics.goalStatuses.filter((goal) => goal.progress >= 100);
  const totalGoalTarget = metrics.goalStatuses.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalGoalCurrent = metrics.goalStatuses.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalGoalRemaining = Math.max(totalGoalTarget - totalGoalCurrent, 0);

  const goalProgress =
    totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0;

  const topCategory = categories[0];

  const recommendation = (() => {
    if (exceededBudgets.length > 0) {
      return `Сначала сократите расходы по превышенным бюджетам: ${exceededBudgets
        .map((budget) => budget.categoryName)
        .join(', ')}.`;
    }

    if (warningBudgets.length > 0) {
      return `Лимиты почти исчерпаны: ${warningBudgets
        .map((budget) => budget.categoryName)
        .join(', ')}. Эти категории стоит контролировать до конца периода.`;
    }

    if (activeGoals.length > 0 && metrics.balance > 0) {
      return `Есть свободный остаток ${formatKzt(metrics.balance)}. Можно направить часть на цель “${activeGoals[0].title}”.`;
    }

    if (topCategory) {
      return `Для улучшения контроля можно создать бюджет для категории “${topCategory.name}”.`;
    }

    return 'Добавьте бюджеты и цели, чтобы FinBuddy мог точнее оценивать финансовый план.';
  })();

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
              <Target size={14} />
              Planning Center
            </div>

            <h2 className="text-2xl font-black text-ink">{t('planning.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-muted">
              {t('planning.subtitle')}
            </p>
          </div>

          <div className="rounded-3xl bg-soft p-4 text-right">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Рекомендация</p>
            <p className="mt-1 max-w-sm text-sm font-black leading-6 text-ink">{recommendation}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-blue-50 p-5 text-primary">
            <Gauge size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('planning.budgets')}</p>
            <p className="mt-1 text-3xl font-black">{budgets.length}</p>
          </div>

          <div className="rounded-3xl bg-rose-50 p-5 text-rose-700">
            <AlertTriangle size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('planning.exceeded')}</p>
            <p className="mt-1 text-3xl font-black">{exceededBudgets.length}</p>
          </div>

          <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
            <Flag size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('planning.activeGoals')}</p>
            <p className="mt-1 text-3xl font-black">{activeGoals.length}</p>
          </div>

          <div className="rounded-3xl bg-violet-50 p-5 text-violet-700">
            <PiggyBank size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('planning.leftToSave')}</p>
            <p className="mt-1 text-3xl font-black">{formatKzt(totalGoalRemaining)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="card p-5">
          <div className="mb-5">
            <h3 className="text-xl font-black text-ink">{t('planning.categoryLimits')}</h3>
            <p className="mt-1 text-sm font-bold text-muted">
              {t('planning.categoryLimitsDesc')}
            </p>
          </div>

          {metrics.budgetStatuses.length === 0 ? (
            <div className="rounded-3xl bg-soft p-5 text-sm font-bold leading-6 text-muted">
              {t('planning.noBudgets')}
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.budgetStatuses.map((budget) => (
                <div key={budget.id} className="rounded-3xl border border-line bg-soft p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-ink">{budget.categoryName}</p>
                      <p className="mt-1 text-xs font-bold text-muted">
                        Потрачено {formatKzt(budget.spentAmount)} из {formatKzt(budget.limitAmount)}
                      </p>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[budget.status]}`}>
                      {statusLabels[budget.status]}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full ${
                        budget.status === 'exceeded'
                          ? 'bg-rose-500'
                          : budget.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, budget.percent)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-black text-muted">
                    <span>{budget.percent}% использовано</span>
                    <span>Осталось: {formatKzt(budget.remainingAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-5">
            <h3 className="text-xl font-black text-ink">{t('planning.goals')}</h3>
            <p className="mt-1 text-sm font-bold text-muted">
              {t('planning.goalsDesc')}
            </p>
          </div>

          {metrics.goalStatuses.length === 0 ? (
            <div className="rounded-3xl bg-soft p-5 text-sm font-bold leading-6 text-muted">
              {t('planning.goals')} не добавлены. Цели помогают системе оценивать накопления и давать рекомендации.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-line bg-soft p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-black text-ink">{t('planning.totalProgress')}</p>
                  <p className="text-sm font-black text-primary">{goalProgress}%</p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, goalProgress)}%` }}
                  />
                </div>

                <p className="mt-3 text-xs font-bold text-muted">
                  Накоплено {formatKzt(totalGoalCurrent)} из {formatKzt(totalGoalTarget)}
                </p>
              </div>

              {metrics.goalStatuses.map((goal) => (
                <div key={goal.id} className="rounded-3xl border border-line bg-soft p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-ink">{goal.title}</p>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {formatKzt(goal.currentAmount)} из {formatKzt(goal.targetAmount)}
                      </p>
                    </div>

                    {goal.progress >= 100 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        <CheckCircle2 size={13} />
                        {t('planning.done')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-primary">
                        {goal.progress}%
                      </span>
                    )}
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-xs font-bold text-muted sm:flex-row sm:items-center sm:justify-between">
                    <span>Осталось: {formatKzt(goal.remainingAmount)}</span>
                    <span>{t('planning.deadline')}: {goal.deadline ? formatDateRu(goal.deadline) : 'не указан'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-5 text-emerald-800">
        <h3 className="text-xl font-black">{t('planning.howAffectsScore')}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">Бюджеты под контролем</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Если бюджеты есть и лимиты не превышены, рейтинг получает положительный фактор.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">Превышенные лимиты</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Если категория превысила лимит, рейтинг снижается и появляется риск.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">Активные цели</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Наличие активных финансовых целей повышает оценку дисциплины.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
