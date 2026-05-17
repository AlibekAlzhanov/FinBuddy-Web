import { CategorySummary, DashboardMetrics } from '../types/finance';
import {
  ReportRiskLevel,
  ReportStatus,
  StructuredAiReport,
  StructuredReportRecommendation,
  StructuredReportRisk,
} from '../types/report';
import { formatKzt } from './format';
import { getChangeText } from './compare';

const normalizeStatus = (value: unknown): ReportStatus => {
  const text = String(value || '').toLowerCase();

  if (text === 'good' || text.includes('хорош')) return 'good';
  if (text === 'critical' || text.includes('крит')) return 'critical';
  if (text === 'risk' || text.includes('риск')) return 'risk';

  return 'normal';
};

const normalizeRiskLevel = (value: unknown): ReportRiskLevel => {
  const text = String(value || '').toLowerCase();

  if (text === 'high' || text.includes('выс')) return 'high';
  if (text === 'medium' || text.includes('сред')) return 'medium';

  return 'low';
};

const normalizePriority = (
  value: unknown,
): StructuredReportRecommendation['priority'] => {
  const text = String(value || '').toLowerCase();

  if (text === 'high' || text.includes('выс')) return 'high';
  if (text === 'low' || text.includes('низ')) return 'low';

  return 'medium';
};

const asStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
};

const stripCodeFence = (text: string) => {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
};

export const buildStructuredReportPrompt = ({
  periodName,
  metrics,
  previousMetrics,
  categories,
  previousCategories,
}: {
  periodName: string;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
  previousCategories: CategorySummary[];
}) => {
  const currentCategories = categories.slice(0, 8).map((category) => ({
    name: category.name,
    amount: category.amount,
    percent: category.percent,
    count: category.count,
    previousAmount:
      previousCategories.find((item) => item.name === category.name)?.amount || 0,
  }));

  return `
Сформируй структурированный финансовый отчёт для веб-дашборда FinBuddy.

Верни СТРОГО JSON без markdown и без пояснений вне JSON.
Язык всех текстовых полей — русский.
Все суммы указывай в тенге, формат "25 000 ₸".
Не используй рубли.

Период: ${periodName}

Текущие показатели:
- Доходы: ${formatKzt(metrics.totalIncome)}
- Расходы: ${formatKzt(metrics.totalExpense)}
- Баланс: ${formatKzt(metrics.balance)}
- Доля расходов от дохода: ${metrics.expensePercent}%
- Норма накопления: ${metrics.savingRate}%
- Финансовый рейтинг: ${metrics.financialScore}/100
- Прогноз расходов: ${formatKzt(metrics.forecastExpense)}
- Количество операций: ${metrics.transactionCount}

Прошлый месяц:
- Доходы: ${formatKzt(previousMetrics.totalIncome)}
- Расходы: ${formatKzt(previousMetrics.totalExpense)}
- Баланс: ${formatKzt(previousMetrics.balance)}
- Финансовый рейтинг: ${previousMetrics.financialScore}/100
- Количество операций: ${previousMetrics.transactionCount}

Категории расходов:
${JSON.stringify(currentCategories, null, 2)}

Формат JSON:
{
  "title": "Финансовый отчёт FinBuddy",
  "period": "${periodName}",
  "status": "good | normal | risk | critical",
  "summary": "короткое резюме 2-3 предложения",
  "keyFindings": [
    "ключевой вывод 1",
    "ключевой вывод 2",
    "ключевой вывод 3"
  ],
  "financialIndicators": [
    { "label": "Доходы", "value": "000 ₸", "comment": "комментарий" },
    { "label": "Расходы", "value": "000 ₸", "comment": "комментарий" },
    { "label": "Баланс", "value": "000 ₸", "comment": "комментарий" },
    { "label": "Финансовый рейтинг", "value": "00/100", "comment": "комментарий" }
  ],
  "monthComparison": [
    { "label": "Доходы", "value": "+0%", "comment": "сравнение с прошлым месяцем" },
    { "label": "Расходы", "value": "-0%", "comment": "сравнение с прошлым месяцем" },
    { "label": "Баланс", "value": "+0%", "comment": "сравнение с прошлым месяцем" }
  ],
  "categoryAnalysis": [
    { "label": "Категория", "value": "000 ₸", "comment": "почему важна" }
  ],
  "risks": [
    { "title": "Название риска", "level": "low | medium | high", "description": "описание риска" }
  ],
  "recommendations": [
    { "priority": "high | medium | low", "title": "Рекомендация", "description": "что сделать" }
  ],
  "actionPlan": [
    "конкретное действие 1",
    "конкретное действие 2",
    "конкретное действие 3"
  ],
  "conclusion": "финальный вывод"
}

Требования:
1. Не выдумывай несуществующие категории.
2. Не делай длинный текст.
3. Рекомендации должны быть практическими.
4. Если данных мало, честно укажи это.
`;
};

export const buildFallbackStructuredReport = ({
  periodName,
  metrics,
  previousMetrics,
  categories,
}: {
  periodName: string;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  categories: CategorySummary[];
}): StructuredAiReport => {
  const topCategory = categories[0];
  const status: ReportStatus =
    metrics.expensePercent >= 100
      ? 'critical'
      : metrics.expensePercent >= 80
        ? 'risk'
        : metrics.savingRate >= 20
          ? 'good'
          : 'normal';

  const risks: StructuredReportRisk[] = [];

  if (metrics.expensePercent >= 80) {
    risks.push({
      title: 'Высокая доля расходов',
      level: metrics.expensePercent >= 100 ? 'high' : 'medium',
      description: `Расходы составляют ${metrics.expensePercent}% от дохода. Это снижает финансовую устойчивость.`,
    });
  }

  if (topCategory && topCategory.percent >= 30) {
    risks.push({
      title: `Концентрация расходов в категории “${topCategory.name}”`,
      level: topCategory.percent >= 45 ? 'high' : 'medium',
      description: `На категорию приходится ${topCategory.percent}% всех расходов за период.`,
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: 'Критических рисков не найдено',
      level: 'low',
      description: 'За выбранный период нет явных признаков резкого перерасхода.',
    });
  }

  return {
    title: 'Финансовый отчёт FinBuddy',
    period: periodName,
    status,
    summary:
      metrics.transactionCount === 0
        ? 'За выбранный период нет операций. Для точного отчёта нужно добавить доходы и расходы.'
        : `За период доходы составили ${formatKzt(metrics.totalIncome)}, расходы — ${formatKzt(metrics.totalExpense)}, баланс — ${formatKzt(metrics.balance)}.`,
    keyFindings: [
      `Финансовый рейтинг: ${metrics.financialScore}/100.`,
      `Расходы составляют ${metrics.expensePercent}% от дохода.`,
      topCategory
        ? `Крупнейшая категория расходов: “${topCategory.name}” — ${formatKzt(topCategory.amount)}.`
        : 'Расходы по категориям пока не сформированы.',
    ],
    financialIndicators: [
      {
        label: 'Доходы',
        value: formatKzt(metrics.totalIncome),
        comment: `К прошлому месяцу: ${getChangeText(metrics.totalIncome, previousMetrics.totalIncome)}.`,
      },
      {
        label: 'Расходы',
        value: formatKzt(metrics.totalExpense),
        comment: `К прошлому месяцу: ${getChangeText(metrics.totalExpense, previousMetrics.totalExpense)}.`,
      },
      {
        label: 'Баланс',
        value: formatKzt(metrics.balance),
        comment: `Норма накопления: ${metrics.savingRate}%.`,
      },
      {
        label: 'Финансовый рейтинг',
        value: `${metrics.financialScore}/100`,
        comment: `Прогноз расходов: ${formatKzt(metrics.forecastExpense)}.`,
      },
    ],
    monthComparison: [
      {
        label: 'Доходы',
        value: getChangeText(metrics.totalIncome, previousMetrics.totalIncome),
        comment: `Сейчас ${formatKzt(metrics.totalIncome)}, раньше ${formatKzt(previousMetrics.totalIncome)}.`,
      },
      {
        label: 'Расходы',
        value: getChangeText(metrics.totalExpense, previousMetrics.totalExpense),
        comment: `Сейчас ${formatKzt(metrics.totalExpense)}, раньше ${formatKzt(previousMetrics.totalExpense)}.`,
      },
      {
        label: 'Баланс',
        value: getChangeText(metrics.balance, previousMetrics.balance),
        comment: `Сейчас ${formatKzt(metrics.balance)}, раньше ${formatKzt(previousMetrics.balance)}.`,
      },
    ],
    categoryAnalysis: categories.slice(0, 5).map((category) => ({
      label: category.name,
      value: formatKzt(category.amount),
      comment: `${category.percent}% расходов, ${category.count} операций.`,
    })),
    risks,
    recommendations: [
      {
        priority: 'high',
        title: topCategory ? `Проверить категорию “${topCategory.name}”` : 'Добавить больше данных',
        description: topCategory
          ? `Попробуйте снизить расходы в этой категории хотя бы на 10–15%.`
          : 'Добавьте операции, бюджеты и цели для более точного анализа.',
      },
      {
        priority: 'medium',
        title: 'Контролировать ежедневный лимит',
        description: `Ориентируйтесь на средний дневной расход ${formatKzt(metrics.averageDailyExpense)}.`,
      },
    ],
    actionPlan: [
      topCategory
        ? `Проверить последние операции в категории “${topCategory.name}”.`
        : 'Добавить операции за выбранный период.',
      'Сравнить расходы с прошлым месяцем.',
      'Установить лимит на самую крупную категорию.',
    ],
    conclusion:
      status === 'good'
        ? 'Финансовое состояние выглядит устойчивым. Основная задача — сохранить текущий контроль расходов.'
        : status === 'critical'
          ? 'Финансовое состояние требует внимания: расходы превышают допустимый уровень.'
          : 'Финансовое состояние можно улучшить за счёт контроля крупнейших категорий расходов.',
  };
};

export const parseStructuredReport = (
  text: string,
  fallback: StructuredAiReport,
): StructuredAiReport => {
  try {
    const parsed = JSON.parse(stripCodeFence(text));

    return {
      title: String(parsed.title || fallback.title),
      period: String(parsed.period || fallback.period),
      status: normalizeStatus(parsed.status),
      summary: String(parsed.summary || fallback.summary),
      keyFindings: asStringArray(parsed.keyFindings).length
        ? asStringArray(parsed.keyFindings)
        : fallback.keyFindings,
      financialIndicators: Array.isArray(parsed.financialIndicators)
        ? parsed.financialIndicators.map((item: any) => ({
            label: String(item.label || ''),
            value: String(item.value || ''),
            comment: item.comment ? String(item.comment) : undefined,
          })).filter((item: any) => item.label && item.value)
        : fallback.financialIndicators,
      monthComparison: Array.isArray(parsed.monthComparison)
        ? parsed.monthComparison.map((item: any) => ({
            label: String(item.label || ''),
            value: String(item.value || ''),
            comment: item.comment ? String(item.comment) : undefined,
          })).filter((item: any) => item.label && item.value)
        : fallback.monthComparison,
      categoryAnalysis: Array.isArray(parsed.categoryAnalysis)
        ? parsed.categoryAnalysis.map((item: any) => ({
            label: String(item.label || ''),
            value: String(item.value || ''),
            comment: item.comment ? String(item.comment) : undefined,
          })).filter((item: any) => item.label && item.value)
        : fallback.categoryAnalysis,
      risks: Array.isArray(parsed.risks)
        ? parsed.risks.map((item: any) => ({
            title: String(item.title || ''),
            level: normalizeRiskLevel(item.level),
            description: String(item.description || ''),
          })).filter((item: any) => item.title && item.description)
        : fallback.risks,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((item: any) => ({
            priority: normalizePriority(item.priority),
            title: String(item.title || ''),
            description: String(item.description || ''),
          })).filter((item: any) => item.title && item.description)
        : fallback.recommendations,
      actionPlan: asStringArray(parsed.actionPlan).length
        ? asStringArray(parsed.actionPlan)
        : fallback.actionPlan,
      conclusion: String(parsed.conclusion || fallback.conclusion),
    };
  } catch {
    return {
      ...fallback,
      summary: text || fallback.summary,
    };
  }
};

export const reportStatusLabel = (status: ReportStatus) => {
  if (status === 'good') return 'Стабильно';
  if (status === 'risk') return 'Есть риски';
  if (status === 'critical') return 'Критично';

  return 'Нормально';
};

export const riskLevelLabel = (level: ReportRiskLevel) => {
  if (level === 'high') return 'Высокий риск';
  if (level === 'medium') return 'Средний риск';

  return 'Низкий риск';
};
