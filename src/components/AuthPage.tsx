import { useState } from 'react';
import { BarChart3, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const mapAuthError = (message?: string) => {
  const raw = String(message || '').toLowerCase();

  if (raw.includes('invalid login credentials')) {
    return 'Неверный email или пароль.';
  }

  if (raw.includes('email not confirmed')) {
    return 'Email ещё не подтверждён.';
  }

  return message || 'Не удалось выполнить вход.';
};

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('ruslan@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isLogin = mode === 'login';

  const submit = async () => {
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage('Введите email и пароль.');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setMessage('Аккаунт создан. Если включено подтверждение email, проверьте почту.');
      }
    } catch (error: any) {
      setMessage(mapAuthError(error?.message));
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'azure') => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setMessage(mapAuthError(error?.message));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-5 py-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[36px] border border-line bg-white shadow-elevated lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative bg-dark p-8 text-white lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,107,255,0.5),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.25),transparent_30%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-16">
              <div>
                <div className="mb-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                    <BarChart3 size={25} />
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-[0.22em]">FinBuddy</p>
                    <p className="text-sm font-bold text-slate-300">Analytics Dashboard</p>
                  </div>
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight lg:text-6xl">
                  Веб-панель для глубокого анализа финансов
                </h1>

                <p className="mt-6 max-w-lg text-base font-semibold leading-7 text-slate-300">
                  Мобильное приложение — для быстрого ввода операций. Этот сайт —
                  для статистики, графиков, категорий и AI-выводов по периоду.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['AI', 'инсайты и прогноз'],
                  ['KPI', 'доходы, расходы, баланс'],
                  ['Charts', 'категории и динамика'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <p className="text-lg font-black">{title}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-7 lg:p-10">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-primary">
                <Sparkles size={17} />
                Защищённый вход
              </div>

              <h2 className="text-3xl font-black text-ink">
                {isLogin ? 'Войти в Dashboard' : 'Создать аккаунт'}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-muted">
                Используйте тот же аккаунт Supabase, что и в мобильном приложении.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl bg-soft p-1">
              <button
                className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                  isLogin ? 'bg-primary text-white shadow-soft' : 'text-muted'
                }`}
                onClick={() => setMode('login')}
              >
                Вход
              </button>

              <button
                className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                  !isLogin ? 'bg-primary text-white shadow-soft' : 'text-muted'
                }`}
                onClick={() => setMode('register')}
              >
                Регистрация
              </button>
            </div>

            <div className="space-y-3">
              <button
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-sm font-black text-ink transition hover:bg-soft"
                onClick={() => socialLogin('google')}
                disabled={loading}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-white text-base">G</span>
                Продолжить с Google
              </button>

              <button
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-sm font-black text-ink transition hover:bg-soft"
                onClick={() => socialLogin('azure')}
                disabled={loading}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-white text-base">M</span>
                Продолжить с Microsoft
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                или email
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-muted">Email</span>
                <div className="flex items-center rounded-2xl border border-line bg-soft px-4">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    className="w-full bg-transparent px-3 py-4 text-sm font-bold text-ink outline-none"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-muted">Пароль</span>
                <div className="flex items-center rounded-2xl border border-line bg-soft px-4">
                  <Lock size={18} className="text-slate-400" />
                  <input
                    className="w-full bg-transparent px-3 py-4 text-sm font-bold text-ink outline-none"
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                  />
                </div>
              </label>
            </div>

            {!!message && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                {message}
              </div>
            )}

            <button
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-black text-white shadow-soft transition hover:bg-blue-700 disabled:opacity-60"
              onClick={submit}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? 'Войти' : 'Создать аккаунт'}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
