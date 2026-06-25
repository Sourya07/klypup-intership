import { z } from 'zod';

export const createRunSchema = z.object({
  ticker: z.string().min(1, 'Ticker symbol is required').toUpperCase(),
  prompt: z.string().min(5, 'Research prompt/query is required'),
});

export const updateReportSchema = z.object({
  title: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
