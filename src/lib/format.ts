export const formatKzt = (value: number) => {
  return `${Math.round(value || 0).toLocaleString('ru-KZ')} ₸`;
};

export const formatPercent = (value: number) => {
  return `${Math.round(value || 0)}%`;
};

export const formatDateRu = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ru-KZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
