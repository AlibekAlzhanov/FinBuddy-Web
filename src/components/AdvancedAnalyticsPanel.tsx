import { AlertTriangle, CheckCircle2, Gauge, Lightbulb, ShieldAlert } from 'lucide-react';
import { CategorySummary, DashboardMetrics, Transaction } from '../types/finance';
import {
  buildCategoryRisks,
  buildForecastInsight,
  buildSmartRecommendations,
  detectSpendingAnomalies,
  RiskTone,
} from '../lib/advancedAnalytics';
import { formatDateRu, formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  previousCategories: CategorySummary[];
  transactions: Transaction[];
  periodEnd: Date;
};

const toneClasses: Record<RiskTone, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  normal: 'bg-blue-50 text-primary border-blue-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
};

const toneDotClasses: Record<RiskTone, string> = {
  good: 'bg-emerald-500',
  normal: 'bg-primary',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export default function AdvancedAnalyticsPanel({
  metrics,
  categories,
  previousCategories,
  transactions,
  periodEnd,
}: Props) {
  const { t } = useLanguage();
  const forecast = buildForecastInsight({ metrics, periodEnd });
  const anomalies = detectSpendingAnomalies(transactions);
  const categoryRisks = buildCategoryRisks({ categories, previousCategories });
  const recommendations = buildSmartRecommendations({
    metrics,
    categories,
    categoryRisks,
    anomalies,
  });

  const forecastTitle =
    forecast.tone === 'danger' && metrics.totalIncome <= 0
      ? t('advanced.noIncome')
      : forecast.tone === 'danger'
        ? t('advanced.overForecast')
        : forecast.tone === 'warning'
          ? t('advanced.nearRisk')
          : forecast.tone === 'good'
            ? t('advanced.stableForecast')
            : t('advanced.normalDynamics');

  const forecastDescription =
    forecast.tone === 'danger' && metrics.totalIncome <= 0
      ? t('advanced.noIncomeDesc')
      : forecast.tone === 'danger'
        ? t('advanced.overForecastDesc')
        : forecast.tone === 'warning'
          ? t('advanced.nearRiskDesc')
          : forecast.tone === 'good'
            ? t('advanced.stableForecastDesc')
            : t('advanced.normalDynamicsDesc');

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <Gauge size={14} />
              {t('advanced.badge')}
            </div>
            <h2 className="text-2xl font-black text-ink">{t('advanced.title')}</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-muted">
              {t('advanced.subtitle')}
            </p>
          </div>

          <span className={`rounded-full border px-4 py-2 text-xs font-black ${toneClasses[forecast.tone]}`}>
            {forecastTitle}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-soft p-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">
              {t('advanced.safeLimit')}
            </p>
            <p className="mt-2 text-3xl font-black text-ink">
              {formatKzt(forecast.safeDailySpend)}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              {t('advanced.nextDays')}: {forecast.remainingDays}
            </p>
          </div>

          <div className="rounded-3xl bg-soft p-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">
              {t('advanced.forecast')}
            </p>
            <p className="mt-2 text-3xl font-black text-ink">
              {formatKzt(metrics.forecastExpense)}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              {t('advanced.currentPace')}
            </p>
          </div>

          <div className={`rounded-3xl border p-5 ${toneClasses[forecast.tone]}`}>
            <p className="text-xs font-black uppercase tracking-wider">
              {t('advanced.result')}
            </p>
            <p className="mt-2 text-sm font-black leading-6">
              {forecastDescription}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink">{t('advanced.anomalies')}</h2>
              <p className="text-sm font-bold text-muted">
                {t('advanced.anomaliesDesc')}
              </p>
            </div>
          </div>

          {anomalies.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
              <CheckCircle2 size={24} />
              <p className="mt-3 text-sm font-black">
                {t('advanced.noAnomalies')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="rounded-3xl border border-line bg-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-ink">{anomaly.title}</p>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {anomaly.category} · {formatDateRu(anomaly.date)}
                      </p>
                      <p className="mt-2 text-xs font-bold text-amber-700">
                        {anomaly.reason}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-black text-rose-500">
                      {formatKzt(anomaly.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-primary">
              <Lightbulb size={21} />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink">{t('advanced.recommendations')}</h2>
              <p className="text-sm font-bold text-muted">
                {t('advanced.recommendationsDesc')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.title} className={`rounded-3xl border p-4 ${toneClasses[item.tone]}`}>
                <p className="font-black">{item.title}</p>
                <p className="mt-2 text-sm font-bold leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            <ShieldAlert size={21} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink">{t('advanced.riskMatrix')}</h2>
            <p className="text-sm font-bold text-muted">
              {t('advanced.riskMatrixDesc')}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {categoryRisks.map((category) => (
            <div key={category.id} className="rounded-3xl border border-line bg-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${toneDotClasses[category.tone]}`} />
                  <p className="font-black text-ink">{category.name}</p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClasses[category.tone]}`}>
                  {category.changePercent > 0 ? '+' : ''}
                  {category.changePercent}%
                </span>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full ${toneDotClasses[category.tone]}`}
                  style={{ width: `${Math.min(100, category.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-muted">
                <span>{category.percent}%</span>
                <span>{formatKzt(category.amount)}</span>
              </div>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                {category.comment}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
