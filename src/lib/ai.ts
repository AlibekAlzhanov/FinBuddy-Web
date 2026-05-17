import { supabase } from './supabase';

export type FinanceAiMode = 'chat' | 'analytics' | 'report';

export type FinanceAiResponse = {
  answer: string;
  mode?: FinanceAiMode;
  period?: {
    start: string;
    end: string;
    name: string;
  };
  source?: string;
};

export const callFinanceAi = async ({
  question,
  mode,
  periodStart,
  periodEnd,
}: {
  question: string;
  mode: FinanceAiMode;
  periodStart: Date;
  periodEnd: Date;
}) => {
  const { data, error } = await supabase.functions.invoke('finance-ai', {
    body: {
      question,
      mode,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.answer) {
    throw new Error('finance-ai вернул пустой ответ.');
  }

  return data as FinanceAiResponse;
};
