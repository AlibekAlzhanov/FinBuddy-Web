import { CheckCircle2, FileText, ListChecks, ShieldAlert, TrendingUp } from 'lucide-react';
import { StructuredAiReport } from '../types/report';
import { reportStatusLabel, riskLevelLabel } from '../lib/report';

const statusClasses = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  normal: 'bg-blue-50 text-primary border-blue-100',
  risk: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

const riskClasses = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-rose-50 text-rose-700',
};

const priorityClasses = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-50 text-primary',
  high: 'bg-rose-50 text-rose-700',
};

type Props = {
  report: StructuredAiReport;
};

export default function StructuredReportView({ report }: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-line bg-white p-5 text-ink">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <FileText size={14} />
              Структурированный отчёт
            </div>

            <h3 className="text-2xl font-black">{report.title}</h3>
            <p className="mt-1 text-sm font-bold text-muted">{report.period}</p>
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-sm font-black ${statusClasses[report.status]}`}
          >
            {reportStatusLabel(report.status)}
          </div>
        </div>

        <p className="mt-4 text-base font-bold leading-7 text-slate-700">
          {report.summary}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] border border-line bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-primary">
              <TrendingUp size={19} />
            </div>
            <h4 className="text-lg font-black text-ink">Финансовые показатели</h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {report.financialIndicators.map((item) => (
              <div key={item.label} className="rounded-3xl bg-soft p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
                <p className="mt-2 text-xl font-black text-ink">{item.value}</p>
                {item.comment && (
                  <p className="mt-1 text-xs font-bold leading-5 text-muted">{item.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={19} />
            </div>
            <h4 className="text-lg font-black text-ink">Ключевые выводы</h4>
          </div>

          <div className="space-y-3">
            {report.keyFindings.map((item, index) => (
              <div key={index} className="flex gap-3 rounded-3xl bg-soft p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-line bg-white p-5">
        <h4 className="text-lg font-black text-ink">Сравнение с прошлым месяцем</h4>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.monthComparison.map((item) => (
            <div key={item.label} className="rounded-3xl border border-line bg-soft p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-ink">{item.value}</p>
              {item.comment && (
                <p className="mt-1 text-xs font-bold leading-5 text-muted">{item.comment}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5">
        <h4 className="text-lg font-black text-ink">Анализ категорий</h4>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {report.categoryAnalysis.map((item) => (
            <div key={item.label} className="rounded-3xl bg-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-ink">{item.label}</p>
                  {item.comment && (
                    <p className="mt-1 text-xs font-bold leading-5 text-muted">{item.comment}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-black text-primary">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] border border-line bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <ShieldAlert size={19} />
            </div>
            <h4 className="text-lg font-black text-ink">Риски</h4>
          </div>

          <div className="space-y-3">
            {report.risks.map((risk) => (
              <div key={risk.title} className="rounded-3xl border border-line bg-soft p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{risk.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClasses[risk.level]}`}>
                    {riskLevelLabel(risk.level)}
                  </span>
                </div>
                <p className="text-sm font-bold leading-6 text-muted">{risk.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-primary">
              <ListChecks size={19} />
            </div>
            <h4 className="text-lg font-black text-ink">Рекомендации</h4>
          </div>

          <div className="space-y-3">
            {report.recommendations.map((item) => (
              <div key={item.title} className="rounded-3xl border border-line bg-soft p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityClasses[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm font-bold leading-6 text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-line bg-white p-5">
        <h4 className="text-lg font-black text-ink">План действий</h4>

        <ol className="mt-4 space-y-3">
          {report.actionPlan.map((item, index) => (
            <li key={index} className="flex gap-3 rounded-3xl bg-soft p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-dark text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-6 text-slate-700">{item}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[28px] border border-blue-100 bg-blue-50 p-5">
        <h4 className="text-lg font-black text-primary">Заключение</h4>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{report.conclusion}</p>
      </section>
    </div>
  );
}
