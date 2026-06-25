import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  const body: ApiResponse<T> = { success: true, data, error: null };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, statusCode: number, message: string, meta?: Record<string, unknown>) {
  const body: ApiResponse = { success: false, data: null, error: message };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return sendSuccess(res, data, 200, {
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
