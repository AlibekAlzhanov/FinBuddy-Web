import { CalendarClock, CheckCircle2, Repeat, ShieldAlert, WalletCards } from 'lucide-react';
import { RecurringPayment, Transaction } from '../types/finance';
import { buildRecurringAudit, getRecurringAuditConclusion, RecurringRisk } from '../lib/recurringAudit';
import { formatDateRu, formatKzt } from '../lib/format';
import { useLanguage } from '../lib/i18n';

type Props = {
  transactions: Transaction[];
  recurringPayments?: RecurringPayment[];
};

const riskClasses: Record<RecurringRisk, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  high: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function RecurringAuditPanel({ transactions, recurringPayments = [] }: Props) {
  const { language, t } = useLanguage();
  const summary = buildRecurringAudit(transactions, recurringPayments);
  const conclusion = getRecurringAuditConclusion(summary);

  const riskLabels: Record<RecurringRisk, string> = {
    low: language === 'en' ? 'Low risk' : 'Низкий риск',
    medium: language === 'en' ? 'Medium risk' : 'Средний риск',
    high: t('recurring.highRisk'),
  };

  const operationCountLabel = language === 'en' ? 'operations' : 'операций';

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-700">
              <Repeat size={14} />
              {t('recurring.badge')}
            </div>

            <h2 className="text-2xl font-black text-ink">{t('recurring.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-muted">
              {t('recurring.subtitle')}
            </p>
          </div>

          <div className="rounded-3xl bg-soft p-4 text-right">
            <p className="text-xs font-black uppercase tracking-wider text-muted">
              {t('common.conclusion')}
            </p>
            <p className="mt-1 max-w-sm text-sm font-black leading-6 text-ink">
              {conclusion}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-blue-50 p-5 text-primary">
            <WalletCards size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">
              {t('recurring.found')}
            </p>
            <p className="mt-1 text-3xl font-black">{summary.subscriptionCount}</p>
          </div>

          <div className="rounded-3xl bg-violet-50 p-5 text-violet-700">
            <CalendarClock size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">
              {t('recurring.monthlyLoad')}
            </p>
            <p className="mt-1 text-3xl font-black">
              {formatKzt(summary.totalMonthlyEstimate)}
            </p>
          </div>

          <div className="rounded-3xl bg-rose-50 p-5 text-rose-700">
            <ShieldAlert size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">
              {t('recurring.highRisk')}
            </p>
            <p className="mt-1 text-3xl font-black">{summary.highRiskCount}</p>
          </div>

          <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2 size={24} />
            <p className="mt-4 text-xs font-black uppercase tracking-wider">
              {t('recurring.potentialSaving')}
            </p>
            <p className="mt-1 text-3xl font-black">
              {formatKzt(summary.potentialSaving)}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-xl font-black text-ink">{t('recurring.listTitle')}</h3>
        <p className="mt-1 text-sm font-bold text-muted">
          {t('recurring.listDesc')}
        </p>

        {summary.payments.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2 size={24} />
            <p className="mt-3 text-sm font-black">{t('recurring.empty')}</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {summary.payments.map((payment) => (
              <div key={payment.id} className="rounded-3xl border border-line bg-soft p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-ink">{payment.title}</p>
                    <p className="mt-1 text-xs font-bold text-muted">
                      {payment.category} · {payment.count} {operationCountLabel} ·{' '}
                      {payment.source === 'recurring_payments'
                        ? t('recurring.fromSubscriptions')
                        : t('recurring.fromTransactions')}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${riskClasses[payment.risk]}`}
                  >
                    {riskLabels[payment.risk]}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">
                      {t('recurring.averagePayment')}
                    </p>
                    <p className="mt-1 text-lg font-black text-ink">
                      {formatKzt(payment.averageAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">
                      {t('recurring.load')}
                    </p>
                    <p className="mt-1 text-lg font-black text-ink">
                      {formatKzt(payment.monthlyEstimate)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-bold leading-6 text-slate-600">
                  {payment.reason}
                </p>

                {payment.dates.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {payment.dates.slice(0, 4).map((date) => (
                      <span
                        key={date}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-muted"
                      >
                        {payment.source === 'recurring_payments' && `${t('recurring.next')}: `}
                        {formatDateRu(date)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
