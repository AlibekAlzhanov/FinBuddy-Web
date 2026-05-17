import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { LanguageProvider, useLanguage } from './lib/i18n';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-soft">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-primary" />
          <p className="text-sm font-black text-muted">{t('common.loadingFinBuddy')}</p>
        </div>
      </div>
    );
  }

  return session ? <DashboardPage /> : <AuthPage />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
