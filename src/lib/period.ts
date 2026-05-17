import { PeriodOption } from '../types/finance';

export const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { start, end };
};

export const getPeriodRange = (period: PeriodOption) => {
  const now = new Date();

  if (period === 'previous') {
    return getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  }

  if (period === 'march') {
    return {
      start: new Date(now.getFullYear(), 2, 1),
      end: new Date(now.getFullYear(), 3, 1),
    };
  }

  if (period === 'april') {
    return {
      start: new Date(now.getFullYear(), 3, 1),
      end: new Date(now.getFullYear(), 4, 1),
    };
  }

  return getMonthRange(now);
};

export const getPeriodLabel = (period: PeriodOption) => {
  const { start, end } = getPeriodRange(period);
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() - 1);

  return `${start.toLocaleDateString('ru-KZ', {
    month: 'long',
    year: 'numeric',
  })}`;
};

export const toIso = (date: Date) => date.toISOString();
