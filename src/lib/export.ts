import { CategorySummary, DashboardMetrics, Transaction } from '../types/finance';
import { StructuredAiReport } from '../types/report';
import { formatDateRu, formatKzt, safeNumber } from './format';
import { getTransactionAmount } from './analytics';
import {
  buildFallbackStructuredReport,
  reportStatusLabel,
  riskLevelLabel,
} from './report';

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

const escapeHtml = (value: unknown) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const downloadTextFile = (
  filename: string,
  content: string,
  mime = 'text/plain;charset=utf-8',
) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildTransactionsCsv = (transactions: Transaction[]) => {
  const header = [
    'Дата',
    'Тип',
    'Сумма KZT',
    'Категория',
    'Счёт',
    'Описание',
  ];

  const rows = transactions.map((tx) => [
    formatDateRu(tx.transaction_date),
    tx.type || '',
    safeNumber(getTransactionAmount(tx)),
    tx.categories?.name || 'Без категории',
    tx.accounts?.name || '',
    tx.note || '',
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(';'))
    .join('\n');
};

const renderReportMarkdownSection = (title: string, lines: string[]) => {
  return [
    `## ${title}`,
    '',
    ...(lines.length ? lines : ['Нет данных.']),
    '',
  ].join('\n');
};

const normalizeAiTextForAppendix = (text?: string) => {
  if (!text) return '';

  return text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/---+/g, '')
    .trim();
};

const getExportReport = ({
  periodName,
  metrics,
  previousMetrics,
  categories,
  structuredReport,
  aiReport,
}: {
  periodName: string;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  structuredReport?: StructuredAiReport | null;
  aiReport?: string;
}) => {
  if (structuredReport) return structuredReport;

  const fallback = buildFallbackStructuredReport({
    periodName,
    metrics,
    previousMetrics,
    categories,
  });

  const cleanedAiText = normalizeAiTextForAppendix(aiReport);

  if (!cleanedAiText) return fallback;

  return {
    ...fallback,
    summary: fallback.summary,
    keyFindings: [
      ...fallback.keyFindings,
      'AI-сводка была получена в свободном формате, поэтому отчёт структурирован системой FinBuddy.',
    ],
    conclusion: cleanedAiText,
  };
};

export const buildReportMarkdown = ({
  periodName,
  metrics,
  previousMetrics,
  categories,
  structuredReport,
  aiReport,
}: {
  periodName: string;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  structuredReport?: StructuredAiReport | null;
  aiReport?: string;
}) => {
  const report = getExportReport({
    periodName,
    metrics,
    previousMetrics,
    categories,
    structuredReport,
    aiReport,
  });

  return [
    `# ${report.title}`,
    '',
    `**Период:** ${report.period || periodName}`,
    `**Статус:** ${reportStatusLabel(report.status)}`,
    '',
    '## 1. Резюме',
    '',
    report.summary,
    '',
    renderReportMarkdownSection(
      '2. Ключевые выводы',
      report.keyFindings.map((item) => `- ${item}`),
    ),
    renderReportMarkdownSection(
      '3. Финансовые показатели',
      report.financialIndicators.map(
        (item) =>
          `- **${item.label}:** ${item.value}${item.comment ? ` — ${item.comment}` : ''}`,
      ),
    ),
    renderReportMarkdownSection(
      '4. Сравнение с прошлым месяцем',
      report.monthComparison.map(
        (item) =>
          `- **${item.label}:** ${item.value}${item.comment ? ` — ${item.comment}` : ''}`,
      ),
    ),
    renderReportMarkdownSection(
      '5. Анализ категорий',
      report.categoryAnalysis.map(
        (item) =>
          `- **${item.label}:** ${item.value}${item.comment ? ` — ${item.comment}` : ''}`,
      ),
    ),
    renderReportMarkdownSection(
      '6. Риски',
      report.risks.map(
        (risk) =>
          `- **${risk.title}** (${riskLevelLabel(risk.level)}): ${risk.description}`,
      ),
    ),
    renderReportMarkdownSection(
      '7. Рекомендации',
      report.recommendations.map(
        (item) => `- **${item.title}:** ${item.description}`,
      ),
    ),
    renderReportMarkdownSection(
      '8. План действий',
      report.actionPlan.map((item, index) => `${index + 1}. ${item}`),
    ),
    '## 9. Заключение',
    '',
    report.conclusion,
    '',
    '---',
    'Сформировано в FinBuddy Analytics Dashboard.',
  ].join('\n');
};

export const printReport = ({
  periodName,
  metrics,
  previousMetrics,
  categories,
  structuredReport,
  aiReport,
}: {
  periodName: string;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  structuredReport?: StructuredAiReport | null;
  aiReport?: string;
}) => {
  const report = getExportReport({
    periodName,
    metrics,
    previousMetrics,
    categories,
    structuredReport,
    aiReport,
  });

  const reportHtml = `
    <h1>${escapeHtml(report.title)}</h1>
    <p class="muted">Период: ${escapeHtml(report.period || periodName)}</p>
    <p class="status">Статус: ${escapeHtml(reportStatusLabel(report.status))}</p>

    <section>
      <h2>1. Резюме</h2>
      <p>${escapeHtml(report.summary)}</p>
    </section>

    <section>
      <h2>2. Ключевые выводы</h2>
      <ul>${report.keyFindings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>3. Финансовые показатели</h2>
      <div class="grid">
        ${report.financialIndicators
          .map(
            (item) => `
              <div class="card">
                <div class="label">${escapeHtml(item.label)}</div>
                <div class="value">${escapeHtml(item.value)}</div>
                <p>${escapeHtml(item.comment || '')}</p>
              </div>
            `,
          )
          .join('')}
      </div>
    </section>

    <section>
      <h2>4. Сравнение с прошлым месяцем</h2>
      <ul>
        ${report.monthComparison
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)} — ${escapeHtml(item.comment || '')}</li>`,
          )
          .join('')}
      </ul>
    </section>

    <section>
      <h2>5. Анализ категорий</h2>
      <ul>
        ${report.categoryAnalysis
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)} — ${escapeHtml(item.comment || '')}</li>`,
          )
          .join('')}
      </ul>
    </section>

    <section>
      <h2>6. Риски</h2>
      <ul>
        ${report.risks
          .map(
            (risk) =>
              `<li><strong>${escapeHtml(risk.title)}</strong> (${escapeHtml(riskLevelLabel(risk.level))}): ${escapeHtml(risk.description)}</li>`,
          )
          .join('')}
      </ul>
    </section>

    <section>
      <h2>7. Рекомендации</h2>
      <ul>
        ${report.recommendations
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.description)}</li>`,
          )
          .join('')}
      </ul>
    </section>

    <section>
      <h2>8. План действий</h2>
      <ol>${report.actionPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
    </section>

    <section>
      <h2>9. Заключение</h2>
      <p>${escapeHtml(report.conclusion)}</p>
    </section>
  `;

  const html = `
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>FinBuddy AI Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #121826; padding: 32px; line-height: 1.55; }
    h1 { font-size: 30px; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 28px; border-bottom: 1px solid #E5EAF1; padding-bottom: 6px; }
    .muted { color: #64748B; font-weight: 700; }
    .status { display: inline-block; background: #EFF6FF; color: #2F6BFF; border-radius: 999px; padding: 6px 12px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
    .card { border: 1px solid #E5EAF1; border-radius: 18px; padding: 14px; }
    .label { color: #64748B; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .value { font-size: 22px; font-weight: 900; margin-top: 6px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  ${reportHtml}
</body>
</html>
`;

  const reportWindow = window.open('', '_blank');

  if (!reportWindow) {
    throw new Error('Браузер заблокировал открытие окна печати.');
  }

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};
