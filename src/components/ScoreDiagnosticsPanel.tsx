import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  LineChart,
  Target,
  WalletCards,
} from 'lucide-react';
import {
  Budget,
  CategorySummary,
  DashboardMetrics,
  Goal,
  RecurringPayment,
  Transaction,
} from '../types/finance';
import { formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  transactions: Transaction[];
  previousTransactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurringPayments: RecurringPayment[];
};

const getImpactClass = (impact: number) => {
  if (impact > 0) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (impact < 0) return 'bg-rose-50 text-rose-700 border-rose-100';

  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getScoreTone = (score: number) => {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (score >= 60) return 'bg-blue-50 text-primary border-blue-100';
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-100';

  return 'bg-rose-50 text-rose-700 border-rose-100';
};

export default function ScoreDiagnosticsPanel({
  metrics,
  previousMetrics,
  categories,
  transactions,
  previousTransactions,
  budgets,
  goals,
  recurringPayments,
}: Props) {
  const { t } = useLanguage();
  const positiveFactors = metrics.scoreFactors.filter((factor) => factor.impact > 0);
  const negativeFactors = metrics.scoreFactors.filter((factor) => factor.impact < 0);
  const activeRecurringPayments = recurringPayments.filter((payment) => payment.is_active !== false);
  const recurringMonthlyLoad = activeRecurringPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  const diagnostics = [
    {
      title: 'Операции периода',
      value: String(transactions.length),
      description: 'Используются для доходов, расходов, графиков и категорий.',
      icon: Database,
    },
    {
      title: 'Операции прошлого периода',
      value: String(previousTransactions.length),
      description: 'Используются для сравнения месяц к месяцу.',
      icon: LineChart,
    },
    {
      title: 'Бюджеты',
      value: String(budgets.length),
      description: 'Влияют на рейтинг, если лимиты превышены или под контролем.',
      icon: Gauge,
    },
    {
      title: 'Цели',
      value: String(goals.length),
      description: 'Активные цели повышают финансовый рейтинг.',
      icon: Target,
    },
    {
      title: 'Подписки',
      value: String(activeRecurringPayments.length),
      description: `Нагрузка: ${formatKzt(recurringMonthlyLoad)} в месяц.`,
      icon: WalletCards,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <Gauge size={14} />
              Score Diagnostics
            </div>

            <h2 className="text-2xl font-black text-ink">{t('score.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-muted">
              {t('score.subtitle')}
            </p>
          </div>

          <div className={`rounded-3xl border p-5 text-right ${getScoreTone(metrics.financialScore)}`}>
            <p className="text-xs font-black uppercase tracking-wider">{t('score.currentScore')}</p>
            <p className="mt-1 text-4xl font-black">{metrics.financialScore}/100</p>
            <p className="mt-1 text-sm font-black">{metrics.financialScoreLabel}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-soft p-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Доходы</p>
            <p className="mt-2 text-2xl font-black text-ink">{formatKzt(metrics.totalIncome)}</p>
          </div>

          <div className="rounded-3xl bg-soft p-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Расходы</p>
            <p className="mt-2 text-2xl font-black text-ink">{formatKzt(metrics.totalExpense)}</p>
          </div>

          <div className="rounded-3xl bg-soft p-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Прогноз расходов</p>
            <p className="mt-2 text-2xl font-black text-ink">{formatKzt(metrics.forecastExpense)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <h3 className="text-xl font-black text-ink">{t('score.whatIncreased')}</h3>
              <p className="text-sm font-bold text-muted">{t('score.positiveDesc')}</p>
            </div>
          </div>

          {positiveFactors.length === 0 ? (
            <div className="rounded-3xl bg-soft p-5 text-sm font-bold text-muted">
              {t('score.noPositive')}
            </div>
          ) : (
            <div className="space-y-3">
              {positiveFactors.map((factor) => (
                <div
                  key={factor.id}
                  className={`rounded-3xl border p-4 ${getImpactClass(factor.impact)}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-black">{factor.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                      +{factor.impact}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-6">{factor.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-700">
              <AlertTriangle size={21} />
            </div>
            <div>
              <h3 className="text-xl font-black text-ink">{t('score.whatDecreased')}</h3>
              <p className="text-sm font-bold text-muted">{t('score.negativeDesc')}</p>
            </div>
          </div>

          {negativeFactors.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-black text-emerald-700">
              {t('score.noNegative')}
            </div>
          ) : (
            <div className="space-y-3">
              {negativeFactors.map((factor) => (
                <div
                  key={factor.id}
                  className={`rounded-3xl border p-4 ${getImpactClass(factor.impact)}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-black">{factor.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                      {factor.impact}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-6">{factor.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h3 className="text-xl font-black text-ink">{t('score.dataDiagnostics')}</h3>
        <p className="mt-1 text-sm font-bold text-muted">
          {t('score.dataDiagnosticsDesc')}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {diagnostics.map((item) => (
            <div key={item.title} className="rounded-3xl border border-line bg-soft p-4">
              <item.icon className="text-primary" size={22} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider text-muted">
                {item.title}
              </p>
              <p className="mt-1 text-3xl font-black text-ink">{item.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-blue-100 bg-blue-50 p-5 text-primary">
        <h3 className="text-xl font-black">{t('score.howCompare')}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">1. Один и тот же период</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Мобильное приложение обычно считает текущий месяц. На сайте выбери тот же месяц.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">2. Наличие подписок</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Если есть recurring_payments, они влияют на прогноз и аудит подписок.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4">
            <p className="font-black">3. Бюджеты и цели</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Рейтинг может измениться, если в базе есть лимиты бюджетов или активные цели.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
