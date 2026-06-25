import { z } from 'zod';

export const createRunSchema = z.object({
  query: z.string().min(10, 'Research query must be at least 10 characters'),
  symbols: z.array(z.string().toUpperCase()).default([]),
  tags: z.array(z.string()).default([]),
});

export const updateReportSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
});

export const listReportsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
