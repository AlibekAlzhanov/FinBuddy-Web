import { CalendarDays, CheckCircle2, Flame, TrendingDown, Wallet } from 'lucide-react';
import { Transaction } from '../types/finance';
import { buildCashflowCalendar, CashflowDay } from '../lib/cashflowCalendar';
import { formatDateRu, formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  transactions: Transaction[];
  periodStart: Date;
  periodEnd: Date;
  periodName: string;
};

const toneClasses: Record<CashflowDay['tone'], string> = {
  empty: 'border-slate-100 bg-slate-50 text-slate-400',
  good: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  normal: 'border-blue-100 bg-blue-50 text-primary',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  danger: 'border-rose-100 bg-rose-50 text-rose-700',
};

const toneLabels: Record<CashflowDay['tone'], string> = {
  empty: 'Нет операций',
  good: 'Плюсовой день',
  normal: 'Обычный день',
  warning: 'Выше нормы',
  danger: 'День риска',
};

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getCalendarOffset = (periodStart: Date) => {
  const day = periodStart.getDay();

  return day === 0 ? 6 : day - 1;
};

export default function CashflowCalendarPage({
  transactions,
  periodStart,
  periodEnd,
  periodName,
}: Props) {
  const { t } = useLanguage();
  const summary = buildCashflowCalendar({
    transactions,
    periodStart,
    periodEnd,
  });

  const offset = getCalendarOffset(periodStart);
  const leadingEmpty = Array.from({ length: offset }, (_, index) => index);
  const topRiskDays = summary.days
    .filter((day) => day.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <CalendarDays size={14} />
              Cashflow Calendar
            </div>

            <h2 className="text-2xl font-black text-ink">{t('calendar.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-muted">
              Визуально показывает дни с доходами, расходами, днями без трат и аномальными расходами за период: {periodName}.
            </p>
          </div>

          <div className="rounded-3xl bg-soft p-4 text-right">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{t('calendar.averageActiveDay')}</p>
            <p className="mt-1 text-2xl font-black text-ink">
              {formatKzt(summary.averageExpensePerActiveDay)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
            <Wallet size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">Доходы</p>
            <p className="mt-1 text-3xl font-black">{formatKzt(summary.totalIncome)}</p>
          </div>

          <div className="rounded-3xl bg-rose-50 p-5 text-rose-700">
            <TrendingDown size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">Расходы</p>
            <p className="mt-1 text-3xl font-black">{formatKzt(summary.totalExpense)}</p>
          </div>

          <div className="rounded-3xl bg-blue-50 p-5 text-primary">
            <CheckCircle2 size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('calendar.noSpendDays')}</p>
            <p className="mt-1 text-3xl font-black">{summary.noSpendDays}</p>
          </div>

          <div className="rounded-3xl bg-amber-50 p-5 text-amber-700">
            <Flame size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">{t('calendar.activeDays')}</p>
            <p className="mt-1 text-3xl font-black">{summary.activeDays}</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-ink">{t('calendar.grid')}</h3>
            <p className="mt-1 text-sm font-bold text-muted">
              {t('calendar.gridDesc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(toneLabels).map(([tone, label]) => (
              <span
                key={tone}
                className={`rounded-full border px-3 py-1 text-xs font-black ${toneClasses[tone as CashflowDay['tone']]}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-1 text-center text-xs font-black uppercase tracking-wider text-muted">
              {day}
            </div>
          ))}

          {leadingEmpty.map((item) => (
            <div key={`empty-${item}`} className="min-h-[112px] rounded-3xl border border-transparent" />
          ))}

          {summary.days.map((day) => (
            <div
              key={day.date}
              className={`min-h-[112px] rounded-3xl border p-3 ${toneClasses[day.tone]}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black">{day.day}</p>
                {day.transactionCount > 0 && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black">
                    {day.transactionCount}
                  </span>
                )}
              </div>

              {day.expense > 0 && (
                <p className="text-xs font-black leading-4">
                  −{formatKzt(day.expense)}
                </p>
              )}

              {day.income > 0 && (
                <p className="mt-1 text-xs font-black leading-4">
                  +{formatKzt(day.income)}
                </p>
              )}

              {day.topCategory !== '—' && (
                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4 opacity-80">
                  {day.topCategory}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="card p-5">
          <h3 className="text-xl font-black text-ink">{t('calendar.riskDays')}</h3>
          <p className="mt-1 text-sm font-bold text-muted">
            {t('calendar.riskDaysDesc')}
          </p>

          {topRiskDays.length === 0 ? (
            <div className="mt-5 rounded-3xl bg-emerald-50 p-5 text-sm font-black text-emerald-700">
              {t('calendar.noExpenses')}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {topRiskDays.map((day, index) => (
                <div key={day.date} className="rounded-3xl border border-line bg-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-ink">
                        {index + 1}. {formatDateRu(day.date)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {day.transactionCount} операций · {t('calendar.mainCategory')}: {day.topCategory}
                      </p>
                    </div>

                    <p className="text-sm font-black text-rose-500">
                      {formatKzt(day.expense)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-blue-100 bg-blue-50 p-5 text-primary">
          <h3 className="text-xl font-black">{t('calendar.howUse')}</h3>

          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-white p-4">
              <p className="font-black">{t('calendar.findRiskDays')}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {t('calendar.findRiskDaysDesc')}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-4">
              <p className="font-black">{t('calendar.checkReason')}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {t('calendar.checkReasonDesc')}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-4">
              <p className="font-black">{t('calendar.noSpendGoal')}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {t('calendar.noSpendGoalDesc')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
