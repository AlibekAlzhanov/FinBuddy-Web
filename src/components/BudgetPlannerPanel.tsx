import { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, PiggyBank, Target, TrendingDown } from 'lucide-react';
import { CategorySummary, DashboardMetrics } from '../types/finance';
import {
  buildBudgetPlan,
  getPlannerConclusion,
  getSuggestedTargetSaving,
  plannerScenarios,
  PlannerScenarioId,
} from '../lib/budgetPlanner';
import { formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  metrics: DashboardMetrics;
  categories: CategorySummary[];
  periodEnd: Date;
};

const scenarioKeyMap: Record<PlannerScenarioId, { title: string; desc: string }> = {
  soft: { title: 'planner.soft', desc: 'planner.softDesc' },
  balanced: { title: 'planner.balanced', desc: 'planner.balancedDesc' },
  strict: { title: 'planner.strict', desc: 'planner.strictDesc' },
};

export default function BudgetPlannerPanel({
  metrics,
  categories,
  periodEnd,
}: Props) {
  const { t } = useLanguage();
  const suggestedTarget = useMemo(() => getSuggestedTargetSaving(metrics), [metrics]);

  const [targetSavingText, setTargetSavingText] = useState(
    suggestedTarget > 0 ? String(suggestedTarget) : '',
  );
  const [scenarioId, setScenarioId] = useState<PlannerScenarioId>('balanced');

  const targetSaving = Number(targetSavingText.replace(/\s/g, '').replace(',', '.')) || 0;

  const plan = useMemo(
    () =>
      buildBudgetPlan({
        metrics,
        categories,
        periodEnd,
        targetSaving,
        scenarioId,
      }),
    [metrics, categories, periodEnd, targetSaving, scenarioId],
  );

  const conclusion = getPlannerConclusion(plan);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
              <Calculator size={14} />
              {t('planner.badge')}
            </div>
            <h2 className="text-2xl font-black text-ink">{t('planner.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-muted">
              {t('planner.subtitle')}
            </p>
          </div>

          <div className="rounded-3xl bg-soft p-4 text-right">
            <p className="text-xs font-black uppercase tracking-wider text-muted">
              {t('planner.suggestedGoal')}
            </p>
            <p className="mt-1 text-xl font-black text-ink">
              {formatKzt(suggestedTarget)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-line bg-soft p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-muted">
                {t('planner.targetBalance')}
              </span>
              <input
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-lg font-black text-ink outline-none"
                value={targetSavingText}
                onChange={(event) => setTargetSavingText(event.target.value)}
                placeholder={t('planner.placeholder')}
                inputMode="numeric"
              />
            </label>

            <div className="mt-4 space-y-2">
              {plannerScenarios.map((scenario) => {
                const isActive = scenario.id === scenarioId;
                const keys = scenarioKeyMap[scenario.id];

                return (
                  <button
                    key={scenario.id}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-primary bg-blue-50'
                        : 'border-line bg-white hover:bg-blue-50'
                    }`}
                    onClick={() => setScenarioId(scenario.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-ink">{t(keys.title)}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary">
                        -{scenario.cutPercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-muted">
                      {t(keys.desc)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-blue-50 p-5 text-primary">
              <Target size={24} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider">
                {t('planner.target')}
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatKzt(plan.targetSaving)}
              </p>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
              <PiggyBank size={24} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider">
                {t('planner.savingPotential')}
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatKzt(plan.savingPotential)}
              </p>
            </div>

            <div
              className={`rounded-3xl p-5 ${
                plan.isTargetReached
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <CheckCircle2 size={24} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider">
                {t('planner.projectedBalance')}
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatKzt(plan.projectedSaving)}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-100 p-5 text-slate-800">
              <TrendingDown size={24} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider">
                {t('planner.dailyLimit')}
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatKzt(plan.dailyLimit)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mt-5 rounded-3xl border p-5 ${
            plan.isTargetReached
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-amber-100 bg-amber-50 text-amber-700'
          }`}
        >
          <p className="font-black">
            {plan.isTargetReached ? t('planner.goalReachable') : t('planner.goalNeedsFix')}
          </p>
          <p className="mt-2 text-sm font-bold leading-6">{conclusion}</p>
          {!plan.isTargetReached && plan.missingSaving > 0 && (
            <p className="mt-2 text-sm font-black">
              {t('planner.missing')}: {formatKzt(plan.missingSaving)}
            </p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-xl font-black text-ink">{t('planner.categoryPlan')}</h3>
        <p className="mt-1 text-sm font-bold text-muted">
          {t('planner.categoryPlanDesc')}
        </p>

        {plan.categoryPlans.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-soft p-5 text-sm font-bold text-muted">
            {t('planner.noCategories')}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {plan.categoryPlans.map((category) => (
              <div key={category.id} className="rounded-3xl border border-line bg-soft p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-ink">{category.name}</p>
                    <p className="mt-1 text-xs font-bold text-muted">
                      {t('planner.current')}: {formatKzt(category.currentAmount)} · {t('planner.share')}: {category.percent}%
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-emerald-700">
                      {t('planner.saving')} {formatKzt(category.savingPotential)}
                    </p>
                    <p className="text-xs font-bold text-muted">
                      {t('planner.limit')}: {formatKzt(category.recommendedLimit)}
                    </p>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        (category.recommendedLimit / Math.max(1, category.currentAmount)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
