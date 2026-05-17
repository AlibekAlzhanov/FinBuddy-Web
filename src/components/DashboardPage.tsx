import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import {
  buildCategorySummary,
  buildDailyChartData,
  buildDashboardMetrics,
  getAiSummaryText,
  getTransactionAmount,
} from '../lib/analytics';
import { callFinanceAi } from '../lib/ai';
import {
  buildComparisonData,
  buildComparisonSummary,
  getChangeText,
  getPreviousRange,
} from '../lib/compare';
import {
  buildReportMarkdown,
  buildTransactionsCsv,
  downloadTextFile,
  printReport,
} from '../lib/export';
import { formatDateRu, formatKzt, formatPercent } from '../lib/format';
import {
  buildFallbackStructuredReport,
  buildStructuredReportPrompt,
  parseStructuredReport,
} from '../lib/report';
import { getPeriodLabel, getPeriodRange } from '../lib/period';
import { Account, Budget, Category, Goal, PeriodOption, RecurringPayment, Transaction } from '../types/finance';
import { DashboardPageId } from '../types/navigation';
import { StructuredAiReport } from '../types/report';
import DashboardLayout from './DashboardLayout';
import EmptyState from './EmptyState';
import KpiCard from './KpiCard';
import StructuredReportView from './StructuredReportView';
import WebAiAssistant from './WebAiAssistant';
import AdvancedAnalyticsPanel from './AdvancedAnalyticsPanel';
import BudgetPlannerPanel from './BudgetPlannerPanel';
import ScoreDiagnosticsPanel from './ScoreDiagnosticsPanel';
import BudgetGoalsPanel from './BudgetGoalsPanel';
import RecurringAuditPanel from './RecurringAuditPanel';
import CashflowCalendarPage from './CashflowCalendarPage';

const chartColors = ['#2F6BFF', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];

type AnalyticsTab = 'overview' | 'forecast' | 'categories' | 'score';
type PlanningTab = 'planner' | 'budgets' | 'subscriptions';

const planningTabs: Array<{
  id: PlanningTab;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: 'planner',
    labelKey: 'planning.tab.planner',
    descriptionKey: 'planning.tab.plannerDesc',
  },
  {
    id: 'budgets',
    labelKey: 'planning.tab.budgets',
    descriptionKey: 'planning.tab.budgetsDesc',
  },
  {
    id: 'subscriptions',
    labelKey: 'planning.tab.subscriptions',
    descriptionKey: 'planning.tab.subscriptionsDesc',
  },
];

const analyticsTabs: Array<{
  id: AnalyticsTab;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: 'overview',
    labelKey: 'analytics.tab.overview',
    descriptionKey: 'analytics.tab.overviewDesc',
  },
  {
    id: 'forecast',
    labelKey: 'analytics.tab.forecast',
    descriptionKey: 'analytics.tab.forecastDesc',
  },
  {
    id: 'categories',
    labelKey: 'analytics.tab.categories',
    descriptionKey: 'analytics.tab.categoriesDesc',
  },
  {
    id: 'score',
    labelKey: 'analytics.tab.score',
    descriptionKey: 'analytics.tab.scoreDesc',
  },
];

const periodOptions: Array<{ value: PeriodOption; labelKey: string }> = [
  { value: 'current', labelKey: 'common.currentMonth' },
  { value: 'previous', labelKey: 'common.previousMonth' },
  { value: 'march', labelKey: 'common.march' },
  { value: 'april', labelKey: 'common.april' },
];

const pageTitleKeys: Record<DashboardPageId, string> = {
  dashboard: 'page.dashboard.title',
  analytics: 'page.analytics.title',
  planning: 'page.planning.title',
  calendar: 'page.calendar.title',
  'ai-report': 'page.aiReport.title',
  transactions: 'page.transactions.title',
  reports: 'page.reports.title',
};

const pageSubtitleKeys: Record<DashboardPageId, string> = {
  dashboard: 'page.dashboard.subtitle',
  analytics: 'page.analytics.subtitle',
  planning: 'page.planning.subtitle',
  calendar: 'page.calendar.subtitle',
  'ai-report': 'page.aiReport.subtitle',
  transactions: 'page.transactions.subtitle',
  reports: 'page.reports.subtitle',
};



export default function DashboardPage() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<DashboardPageId>('dashboard');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('overview');
  const [planningTab, setPlanningTab] = useState<PlanningTab>('planner');
  const [period, setPeriod] = useState<PeriodOption>('current');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previousTransactions, setPreviousTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiReport, setAiReport] = useState('');
  const [structuredReport, setStructuredReport] = useState<StructuredAiReport | null>(null);
  const [aiReportSource, setAiReportSource] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const previousRange = useMemo(() => getPreviousRange(range.start), [range.start]);

  const accountsMap = useMemo(() => {
    return new Map(accounts.map((account) => [account.id, account]));
  }, [accounts]);

  const attachAccounts = (items: Transaction[]) => {
    return items.map((transaction) => ({
      ...transaction,
      accounts: transaction.account_id
        ? accountsMap.get(transaction.account_id) || null
        : null,
    }));
  };

  const getAccountName = (accountId?: string | null) => {
    if (!accountId) return '—';
    return accountsMap.get(accountId)?.name || '—';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setAiError('');
      setAiReport('');
      setStructuredReport(null);
      setAiReportSource('');

      const { data: userResult, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userResult.user?.id;

      if (!userId) {
        setTransactions([]);
        setPreviousTransactions([]);
        setCategories([]);
        setAccounts([]);
        setBudgets([]);
        setGoals([]);
        setRecurringPayments([]);
        return;
      }

      const [transactionsResult, previousTransactionsResult, categoriesResult, accountsResult, budgetsResult, goalsResult, recurringPaymentsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            id,
            user_id,
            type,
            amount,
            base_amount,
            original_amount,
            transaction_date,
            category_id,
            account_id,
            note,
            tags,
            categories(id, name, type)
          `)
          .eq('user_id', userId)
          .gte('transaction_date', range.start.toISOString())
          .lt('transaction_date', range.end.toISOString())
          .order('transaction_date', { ascending: false }),

        supabase
          .from('transactions')
          .select(`
            id,
            user_id,
            type,
            amount,
            base_amount,
            original_amount,
            transaction_date,
            category_id,
            account_id,
            note,
            tags,
            categories(id, name, type)
          `)
          .eq('user_id', userId)
          .gte('transaction_date', previousRange.start.toISOString())
          .lt('transaction_date', previousRange.end.toISOString())
          .order('transaction_date', { ascending: false }),

        supabase
          .from('categories')
          .select('id, name, type')
          .eq('user_id', userId),

        supabase
          .from('accounts')
          .select('id, name, currency_code, currency')
          .eq('user_id', userId),

        supabase
          .from('budgets')
          .select('id, category_id, limit_amount, period')
          .eq('user_id', userId),

        supabase
          .from('goals')
          .select('id, title, target_amount, current_amount, deadline')
          .eq('user_id', userId),

        supabase
          .from('recurring_payments')
          .select('id, title, amount, account_id, category_id, next_payment_date, start_date, frequency, is_active, note')
          .eq('user_id', userId)
          .eq('is_active', true)
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (previousTransactionsResult.error) throw previousTransactionsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (accountsResult.error) throw accountsResult.error;
      if (budgetsResult.error) throw budgetsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (recurringPaymentsResult.error) throw recurringPaymentsResult.error;

      setTransactions((transactionsResult.data || []) as unknown as Transaction[]);
      setPreviousTransactions((previousTransactionsResult.data || []) as unknown as Transaction[]);
      setCategories((categoriesResult.data || []) as Category[]);
      setAccounts((accountsResult.data || []) as Account[]);
      setBudgets((budgetsResult.data || []) as Budget[]);
      setGoals((goalsResult.data || []) as Goal[]);
      setRecurringPayments((recurringPaymentsResult.data || []) as RecurringPayment[]);
    } catch (loadError: any) {
      console.error(loadError);
      setError(loadError?.message || 'Не удалось загрузить аналитику.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const enrichedTransactions = useMemo(
    () => attachAccounts(transactions),
    [transactions, accountsMap],
  );

  const enrichedPreviousTransactions = useMemo(
    () => attachAccounts(previousTransactions),
    [previousTransactions, accountsMap],
  );

  const metrics = useMemo(
    () =>
      buildDashboardMetrics(enrichedTransactions, range.start, range.end, {
        categories,
        budgets,
        goals,
        recurringPayments,
      }),
    [enrichedTransactions, range.start, range.end, categories, budgets, goals, recurringPayments],
  );

  const previousMetrics = useMemo(
    () =>
      buildDashboardMetrics(enrichedPreviousTransactions, previousRange.start, previousRange.end, {
        categories,
        budgets,
        goals,
        recurringPayments,
      }),
    [enrichedPreviousTransactions, previousRange.start, previousRange.end, categories, budgets, goals, recurringPayments],
  );

  const categorySummary = useMemo(
    () => buildCategorySummary(enrichedTransactions, categories),
    [enrichedTransactions, categories],
  );

  const previousCategorySummary = useMemo(
    () => buildCategorySummary(enrichedPreviousTransactions, categories),
    [enrichedPreviousTransactions, categories],
  );

  const dailyChartData = useMemo(
    () => buildDailyChartData(enrichedTransactions),
    [enrichedTransactions],
  );

  const comparisonData = useMemo(
    () => buildComparisonData(metrics, previousMetrics),
    [metrics, previousMetrics],
  );

  const aiSummary = useMemo(
    () => getAiSummaryText(metrics, categorySummary),
    [metrics, categorySummary],
  );

  const comparisonSummary = useMemo(
    () => buildComparisonSummary(metrics, previousMetrics),
    [metrics, previousMetrics],
  );

  const filteredTransactions = useMemo(() => {
    const search = transactionSearch.trim().toLowerCase();

    return enrichedTransactions.filter((transaction) => {
      const matchesType =
        transactionTypeFilter === 'all' || transaction.type === transactionTypeFilter;

      const matchesSearch =
        !search ||
        String(transaction.note || '').toLowerCase().includes(search) ||
        String(transaction.categories?.name || '').toLowerCase().includes(search) ||
        String(transaction.accounts?.name || '').toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });
  }, [enrichedTransactions, transactionSearch, transactionTypeFilter]);

  const generateAiReport = async () => {
    if (transactions.length === 0) {
      setAiError('За выбранный период нет операций для AI-отчёта.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError('');

      const fallbackReport = buildFallbackStructuredReport({
        periodName: getPeriodLabel(period),
        metrics,
        previousMetrics,
        categories: categorySummary,
      });

      const question = buildStructuredReportPrompt({
        periodName: getPeriodLabel(period),
        metrics,
        previousMetrics,
        categories: categorySummary,
        previousCategories: previousCategorySummary,
      });

      const response = await callFinanceAi({
        question,
        mode: 'report',
        periodStart: range.start,
        periodEnd: range.end,
      });

      const parsedReport = parseStructuredReport(response.answer, fallbackReport);

      setAiReport(response.answer);
      setStructuredReport(parsedReport);
      setAiReportSource(response.source || 'finance-ai');
    } catch (reportError: any) {
      console.error(reportError);
      setAiError(
        reportError?.message ||
          'Не удалось получить AI-отчёт. Проверьте Supabase Edge Function finance-ai.',
      );
    } finally {
      setAiLoading(false);
    }
  };

  const exportReportMarkdown = () => {
    const markdown = buildReportMarkdown({
      periodName: getPeriodLabel(period),
      metrics,
      previousMetrics,
      categories: categorySummary,
      structuredReport,
      aiReport,
    });

    downloadTextFile(
      `finbuddy-report-${period}.md`,
      markdown,
      'text/markdown;charset=utf-8',
    );
  };

  const exportCsv = () => {
    const csv = buildTransactionsCsv(enrichedTransactions);

    downloadTextFile(
      `finbuddy-transactions-${period}.csv`,
      csv,
      'text/csv;charset=utf-8',
    );
  };

  const handlePrintReport = () => {
    try {
      printReport({
        periodName: getPeriodLabel(period),
        metrics,
        previousMetrics,
        categories: categorySummary,
        structuredReport,
        aiReport,
      });
    } catch (printError: any) {
      setAiError(printError?.message || 'Не удалось открыть окно печати.');
    }
  };

  const renderHeader = () => (
    <div className="mb-6 flex flex-col gap-4 rounded-[32px] border border-line bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
          <CalendarDays size={14} />
          {getPeriodLabel(period)}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-ink lg:text-4xl">
          {t(pageTitleKeys[activePage])}
        </h1>
        <p className="mt-2 text-sm font-bold text-muted">
          {t(pageSubtitleKeys[activePage])}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          className="rounded-2xl border border-line bg-soft px-4 py-3 text-sm font-black text-ink outline-none"
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodOption)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          onClick={loadData}
        >
          <RefreshCw size={16} />
          {t('common.refresh')}
        </button>
      </div>
    </div>
  );

  const renderKpis = () => (
    <div className="mb-6 grid gap-4 md:grid-cols-4">
      <KpiCard
        title={t('common.income')}
        value={formatKzt(metrics.totalIncome)}
        hint={`${t('kpi.incomeHintPrefix')}: ${getChangeText(metrics.totalIncome, previousMetrics.totalIncome)}`}
        icon={ArrowUpRight}
        tone="green"
      />

      <KpiCard
        title={t('common.expense')}
        value={formatKzt(metrics.totalExpense)}
        hint={`${t('kpi.expenseHintPrefix')}: ${getChangeText(metrics.totalExpense, previousMetrics.totalExpense)}`}
        icon={ArrowDownRight}
        tone="red"
      />

      <KpiCard
        title={t('common.balance')}
        value={formatKzt(metrics.balance)}
        hint={`${t('kpi.savingRate')}: ${formatPercent(metrics.savingRate)}`}
        icon={Wallet}
        tone="blue"
      />

      <KpiCard
        title={t('common.financialScore')}
        value={`${metrics.financialScore}/100`}
        hint={`${t('kpi.forecastExpense')}: ${formatKzt(metrics.forecastExpense)}`}
        icon={TrendingUp}
        tone="dark"
      />
    </div>
  );

  const renderAiHero = () => (
    <section className="rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#111827] to-[#1E293B] p-5 text-white shadow-elevated">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('ai.periodReport')}</h2>
              <p className="text-sm font-bold text-slate-300">
                {t('ai.edgeFunction')}
              </p>
            </div>
          </div>

          <p className="text-base font-bold leading-7 text-slate-100">
            {structuredReport
              ? structuredReport.summary
              : t('ai.needGenerate')}
          </p>

          {!structuredReport && (
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
              {t('ai.preliminary')}: {aiSummary}
            </p>
          )}

          {aiReportSource && (
            <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
              Источник: {aiReportSource}
            </p>
          )}

          {aiError && (
            <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
              {aiError}
            </div>
          )}
        </div>

        <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[360px] xl:grid-cols-1">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
            onClick={generateAiReport}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {aiLoading ? t('ai.generating') : t('ai.generate')}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
            onClick={exportReportMarkdown}
          >
            <Download size={18} />
            {t('ai.downloadMd')}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
            onClick={handlePrintReport}
          >
            <Printer size={18} />
            {t('ai.printPdf')}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
            onClick={exportCsv}
          >
            <Download size={18} />
            {t('ai.exportCsv')}
          </button>
        </div>
      </div>
    </section>
  );

  const renderDailyChart = () => (
    <section className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">{t('chart.daily.title')}</h2>
          <p className="mt-1 text-sm font-bold text-muted">
            {t('chart.daily.subtitle')}
          </p>
        </div>
      </div>

      <div className="h-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyChartData}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
            <Tooltip formatter={(value) => formatKzt(Number(value))} />
            <Area
              type="monotone"
              dataKey="income"
              name="Доходы"
              stroke="#10B981"
              strokeWidth={3}
              fill="url(#income)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Расходы"
              stroke="#F43F5E"
              strokeWidth={3}
              fill="url(#expense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );

  const renderComparison = () => (
    <section className="card p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">{t('chart.comparison.title')}</h2>
          <p className="mt-1 text-sm font-bold text-muted">
            {comparisonSummary}
          </p>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 800 }} />
            <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
            <Tooltip formatter={(value) => formatKzt(Number(value))} />
            <Legend />
            <Bar dataKey="previous" name="Прошлый месяц" radius={[12, 12, 0, 0]} fill="#94A3B8" />
            <Bar dataKey="current" name="Текущий период" radius={[12, 12, 0, 0]} fill="#2F6BFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );

  const renderCategories = () => (
    <section className="card p-5">
      <h2 className="text-xl font-black text-ink">{t('chart.categories.title')}</h2>
      <p className="mt-1 text-sm font-bold text-muted">
        {t('chart.categories.subtitle')}
      </p>

      <div className="mt-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categorySummary.slice(0, 6)}
              innerRadius={64}
              outerRadius={104}
              paddingAngle={3}
              dataKey="amount"
              nameKey="name"
            >
              {categorySummary.slice(0, 6).map((entry, index) => (
                <Cell key={entry.id} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatKzt(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {categorySummary.slice(0, 8).map((item, index) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <div>
                <p className="text-sm font-black text-ink">{item.name}</p>
                <p className="text-xs font-bold text-muted">{item.count} операций · {item.percent}%</p>
              </div>
            </div>
            <p className="text-sm font-black text-ink">{formatKzt(item.amount)}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderCategoryBars = () => (
    <section className="card p-5">
      <h2 className="text-xl font-black text-ink">{t('chart.topCategories.title')}</h2>
      <p className="mt-1 text-sm font-bold text-muted">
        {t('chart.topCategories.subtitle')}
      </p>

      <div className="mt-5 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categorySummary.slice(0, 7)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
            <XAxis type="number" tick={{ fontSize: 12, fontWeight: 700 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={112}
              tick={{ fontSize: 12, fontWeight: 800 }}
            />
            <Tooltip formatter={(value) => formatKzt(Number(value))} />
            <Bar dataKey="amount" radius={[0, 12, 12, 0]} fill="#2F6BFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );

  const renderCategoryChanges = () => (
    <section className="card p-5">
      <h2 className="text-xl font-black text-ink">{t('chart.categoryChanges.title')}</h2>
      <p className="mt-1 text-sm font-bold text-muted">
        {t('chart.categoryChanges.subtitle')}
      </p>

      <div className="mt-5 space-y-4">
        {categorySummary.slice(0, 8).map((category) => {
          const previous = previousCategorySummary.find(
            (item) => item.name === category.name,
          );
          const previousAmount = previous?.amount || 0;

          return (
            <div key={category.id} className="rounded-3xl border border-line bg-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-ink">{category.name}</p>
                  <p className="mt-1 text-xs font-bold text-muted">
                    Сейчас: {formatKzt(category.amount)} · было: {formatKzt(previousAmount)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    category.amount >= previousAmount
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {getChangeText(category.amount, previousAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderTransactionsTable = (items = filteredTransactions) => (
    <section className="card p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">{t('transactions.title')}</h2>
          <p className="mt-1 text-sm font-bold text-muted">
            {items.length} операций за выбранный период
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center rounded-2xl border border-line bg-soft px-4">
            <Search size={17} className="text-slate-400" />
            <input
              className="w-full bg-transparent px-3 py-3 text-sm font-bold text-ink outline-none"
              placeholder={t('transactions.search')}
              value={transactionSearch}
              onChange={(event) => setTransactionSearch(event.target.value)}
            />
          </div>

          <select
            className="rounded-2xl border border-line bg-soft px-4 py-3 text-sm font-black text-ink outline-none"
            value={transactionTypeFilter}
            onChange={(event) =>
              setTransactionTypeFilter(event.target.value as typeof transactionTypeFilter)
            }
          >
            <option value="all">{t('transactions.allTypes')}</option>
            <option value="expense">{t('transactions.expenses')}</option>
            <option value="income">{t('transactions.incomes')}</option>
            <option value="transfer">{t('transactions.transfers')}</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line">
        <table className="w-full min-w-[720px] border-collapse bg-white text-left">
          <thead className="bg-soft">
            <tr>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-muted">{t('table.date')}</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-muted">{t('table.operation')}</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-muted">{t('table.category')}</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-muted">{t('table.account')}</th>
              <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-muted">{t('table.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((transaction) => {
              const isExpense = transaction.type === 'expense';

              return (
                <tr key={transaction.id} className="border-t border-line">
                  <td className="px-5 py-4 text-sm font-bold text-muted">
                    {formatDateRu(transaction.transaction_date)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-black text-ink">
                      {transaction.note || (isExpense ? 'Расход' : 'Доход')}
                    </div>
                    <div className="text-xs font-bold text-muted">{transaction.type}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-muted">
                    {transaction.categories?.name || 'Без категории'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-muted">
                    {transaction.accounts?.name || getAccountName(transaction.account_id)}
                  </td>
                  <td className={`px-5 py-4 text-right text-sm font-black ${
                    isExpense ? 'text-rose-500' : 'text-emerald-600'
                  }`}>
                    {isExpense ? '-' : '+'}
                    {formatKzt(getTransactionAmount(transaction))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );


  const renderAdvancedAnalytics = () => (
    <AdvancedAnalyticsPanel
      metrics={metrics}
      previousMetrics={previousMetrics}
      categories={categorySummary}
      previousCategories={previousCategorySummary}
      transactions={enrichedTransactions}
      periodEnd={range.end}
    />
  );

  const renderBudgetPlanner = () => (
    <BudgetPlannerPanel
      metrics={metrics}
      categories={categorySummary}
      periodEnd={range.end}
    />
  );

  const renderBudgetGoals = () => (
    <BudgetGoalsPanel
      metrics={metrics}
      categories={categorySummary}
      budgets={budgets}
      goals={goals}
    />
  );

  const renderRecurringAudit = () => (
    <RecurringAuditPanel
      transactions={enrichedTransactions}
      recurringPayments={recurringPayments}
    />
  );

  const renderWebAiAssistant = () => (
    <WebAiAssistant
      periodName={getPeriodLabel(period)}
      periodStart={range.start}
      periodEnd={range.end}
      metrics={metrics}
      categories={categorySummary}
    />
  );

  const renderScoreDiagnostics = () => (
    <ScoreDiagnosticsPanel
      metrics={metrics}
      previousMetrics={previousMetrics}
      categories={categorySummary}
      transactions={enrichedTransactions}
      previousTransactions={enrichedPreviousTransactions}
      budgets={budgets}
      goals={goals}
      recurringPayments={recurringPayments}
    />
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {renderKpis()}
      {renderAiHero()}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          {renderDailyChart()}
          {renderTransactionsTable(enrichedTransactions.slice(0, 8))}
        </div>

        <div className="space-y-6">
          {renderCategories()}
        </div>
      </div>
    </div>
  );



  const renderPlanningTabs = () => (
    <section className="card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {planningTabs.map((tab) => {
          const isActive = planningTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`rounded-3xl border p-4 text-left transition ${
                isActive
                  ? 'border-primary bg-blue-50 shadow-soft'
                  : 'border-line bg-soft hover:bg-blue-50'
              }`}
              onClick={() => setPlanningTab(tab.id)}
            >
              <p
                className={`text-sm font-black ${
                  isActive ? 'text-primary' : 'text-ink'
                }`}
              >
                {t(tab.labelKey)}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-muted">
                {t(tab.descriptionKey)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderPlanningPage = () => {
    const content =
      planningTab === 'budgets'
        ? renderBudgetGoals()
        : planningTab === 'subscriptions'
          ? renderRecurringAudit()
          : renderBudgetPlanner();

    return (
      <div className="space-y-6">
        {renderKpis()}
        {renderPlanningTabs()}
        {content}
      </div>
    );
  };

  const renderAnalyticsTabs = () => (
    <section className="card p-4">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {analyticsTabs.map((tab) => {
          const isActive = analyticsTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`rounded-3xl border p-4 text-left transition ${
                isActive
                  ? 'border-primary bg-blue-50 shadow-soft'
                  : 'border-line bg-soft hover:bg-blue-50'
              }`}
              onClick={() => setAnalyticsTab(tab.id)}
            >
              <p
                className={`text-sm font-black ${
                  isActive ? 'text-primary' : 'text-ink'
                }`}
              >
                {t(tab.labelKey)}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-muted">
                {t(tab.descriptionKey)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderAnalyticsContent = () => {
    if (analyticsTab === 'forecast') {
      return renderAdvancedAnalytics();
    }

    if (analyticsTab === 'categories') {
      return (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            {renderCategories()}
            {renderCategoryChanges()}
          </div>

          <div className="space-y-6">
            {renderCategoryBars()}
          </div>
        </div>
      );
    }

    if (analyticsTab === 'score') {
      return renderScoreDiagnostics();
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {renderComparison()}
          {renderDailyChart()}
        </div>

        <div className="space-y-6">
          {renderCategories()}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      {renderKpis()}
      {renderAnalyticsTabs()}
      {renderAnalyticsContent()}
    </div>
  );

  const renderCalendarPage = () => (
    <CashflowCalendarPage
      transactions={enrichedTransactions}
      periodStart={range.start}
      periodEnd={range.end}
      periodName={getPeriodLabel(period)}
    />
  );

  const renderAiReportPage = () => (
    <div className="space-y-6">
      {renderAiHero()}
      {renderWebAiAssistant()}
      {structuredReport ? (
        <StructuredReportView report={structuredReport} />
      ) : (
        <EmptyState
          title={t('empty.aiReport.title')}
          description={t('empty.aiReport.description')}
        />
      )}
    </div>
  );

  const renderTransactionsPage = () => (
    <div className="space-y-6">
      {renderKpis()}
      {renderTransactionsTable()}
    </div>
  );

  const renderReportsPage = () => (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-2xl font-black text-ink">{t('exports.title')}</h2>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-muted">
          Здесь собраны действия для выгрузки аналитики. Markdown подходит для пояснительной записки,
          PDF — для демонстрации, CSV — для проверки исходных операций.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <button
            className="rounded-3xl border border-line bg-soft p-5 text-left transition hover:bg-blue-50"
            onClick={exportReportMarkdown}
          >
            <Download className="text-primary" size={24} />
            <p className="mt-4 text-lg font-black text-ink">{t('exports.mdTitle')}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              {t('exports.mdDesc')}
            </p>
          </button>

          <button
            className="rounded-3xl border border-line bg-soft p-5 text-left transition hover:bg-blue-50"
            onClick={handlePrintReport}
          >
            <Printer className="text-primary" size={24} />
            <p className="mt-4 text-lg font-black text-ink">{t('ai.printPdf')}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              {t('exports.pdfDesc')}
            </p>
          </button>

          <button
            className="rounded-3xl border border-line bg-soft p-5 text-left transition hover:bg-blue-50"
            onClick={exportCsv}
          >
            <FileText className="text-primary" size={24} />
            <p className="mt-4 text-lg font-black text-ink">{t('ai.exportCsv')}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              {t('exports.csvDesc')}
            </p>
          </button>
        </div>
      </section>

      {structuredReport && <StructuredReportView report={structuredReport} />}
    </div>
  );

  const renderActivePage = () => {
    if (activePage === 'analytics') return renderAnalytics();
    if (activePage === 'planning') return renderPlanningPage();
    if (activePage === 'calendar') return renderCalendarPage();
    if (activePage === 'ai-report') return renderAiReportPage();
    if (activePage === 'transactions') return renderTransactionsPage();
    if (activePage === 'reports') return renderReportsPage();

    return renderDashboard();
  };

  return (
    <DashboardLayout activePage={activePage} onPageChange={setActivePage}>
      {renderHeader()}

      {loading ? (
        <div className="card flex min-h-[520px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-primary" size={36} />
            <p className="mt-4 text-sm font-black text-muted">Загрузка аналитики...</p>
          </div>
        </div>
      ) : error ? (
        <EmptyState
          title="Не удалось загрузить данные"
          description={error}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={t('empty.noOperations.title')}
          description={t('empty.noOperations.description')}
        />
      ) : (
        renderActivePage()
      )}
    </DashboardLayout>
  );
}
