import { BarChart3 } from 'lucide-react';

type Props = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-primary">
        <BarChart3 size={28} />
      </div>

      <h3 className="text-xl font-black text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-bold leading-6 text-muted">{description}</p>
    </div>
  );
}
