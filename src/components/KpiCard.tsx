import { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: 'blue' | 'green' | 'red' | 'dark';
};

const tones = {
  blue: 'bg-blue-50 text-primary',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-500',
  dark: 'bg-slate-100 text-slate-900',
};

export default function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
}: Props) {
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-black text-muted">{title}</p>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="text-3xl font-black tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm font-bold text-muted">{hint}</p>
    </div>
  );
}
