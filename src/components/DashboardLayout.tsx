import {
  BarChart3,
  Brain,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  PieChart,
  Target,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import { DashboardPageId } from '../types/navigation';

type Props = {
  children: React.ReactNode;
  activePage: DashboardPageId;
  onPageChange: (page: DashboardPageId) => void;
};

const nav: Array<{
  id: DashboardPageId;
  icon: typeof LayoutDashboard;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    labelKey: 'nav.dashboard',
    descriptionKey: 'nav.dashboardDescription',
  },
  {
    id: 'analytics',
    icon: PieChart,
    labelKey: 'nav.analytics',
    descriptionKey: 'nav.analyticsDescription',
  },
  {
    id: 'planning',
    icon: Target,
    labelKey: 'nav.planning',
    descriptionKey: 'nav.planningDescription',
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    labelKey: 'nav.calendar',
    descriptionKey: 'nav.calendarDescription',
  },
  {
    id: 'ai-report',
    icon: Brain,
    labelKey: 'nav.aiReport',
    descriptionKey: 'nav.aiReportDescription',
  },
  {
    id: 'transactions',
    icon: CreditCard,
    labelKey: 'nav.transactions',
    descriptionKey: 'nav.transactionsDescription',
  },
  {
    id: 'reports',
    icon: FileText,
    labelKey: 'nav.exports',
    descriptionKey: 'nav.exportsDescription',
  },
];

export default function DashboardLayout({
  children,
  activePage,
  onPageChange,
}: Props) {
  const { language, setLanguage, t } = useLanguage();

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const LanguageSwitcher = () => (
    <div className="rounded-2xl bg-white/10 p-1">
      <div className="grid grid-cols-2 gap-1">
        {(['ru', 'en'] as const).map((item) => {
          const isActive = language === item;

          return (
            <button
              key={item}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                isActive
                  ? 'bg-white text-ink'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setLanguage(item)}
            >
              {item.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <aside className="fixed left-5 top-5 hidden h-[calc(100vh-40px)] w-72 flex-col rounded-[32px] bg-dark p-5 text-white shadow-elevated lg:flex">
        <div className="mb-5 flex items-center gap-3 px-2 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-lg font-black tracking-wide">{t('layout.productName')}</p>
            <p className="text-xs font-bold text-slate-400">{t('layout.productSubtitle')}</p>
          </div>
        </div>

        <div className="mb-5 px-1">
          <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {t('layout.language')}
          </p>
          <LanguageSwitcher />
        </div>

        <nav className="space-y-2">
          {nav.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-white text-ink shadow-soft'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => onPageChange(item.id)}
              >
                <item.icon size={18} />
                <span className="min-w-0">
                  <span className="block text-sm font-black">{t(item.labelKey)}</span>
                  <span
                    className={`block text-xs font-bold ${
                      isActive ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    {t(item.descriptionKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <button
          className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
          onClick={logout}
        >
          <LogOut size={17} />
          {t('common.logout')}
        </button>
      </aside>

      <div className="sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="font-black text-ink">{t('layout.productName')}</p>
              <p className="text-xs font-bold text-muted">{t('layout.productSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['ru', 'en'] as const).map((item) => (
              <button
                key={item}
                className={`rounded-xl px-3 py-2 text-xs font-black ${
                  language === item ? 'bg-primary text-white' : 'bg-soft text-muted'
                }`}
                onClick={() => setLanguage(item)}
              >
                {item.toUpperCase()}
              </button>
            ))}

            <button
              className="rounded-xl bg-dark px-3 py-2 text-xs font-black text-white"
              onClick={logout}
            >
              {t('common.logout')}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {nav.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-soft text-muted'
                }`}
                onClick={() => onPageChange(item.id)}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-5 lg:ml-[316px] lg:px-8">{children}</main>
    </div>
  );
}
