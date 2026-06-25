import { z } from 'zod';

export const createWatchlistItemSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker must be 10 characters or fewer')
    .regex(/^[A-Za-z0-9.-]+$/, 'Ticker contains invalid characters'),
});

export type CreateWatchlistItemInput = z.infer<typeof createWatchlistItemSchema>;
