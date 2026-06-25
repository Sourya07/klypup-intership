import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { logger, sendError } from '../utils';
import { ZodError } from 'zod';

export function errorHandler() {
  return (err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Already sent
    if (res.headersSent) return;

    // Zod validation errors
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', { details });
    }

    // Our custom AppError hierarchy
    if (err instanceof AppError) {
      logger.warn(`AppError: ${err.message}`, {
        statusCode: err.statusCode,
        code: err.code,
        path: req.path,
        requestId: req.requestId,
      });
      return sendError(res, err.statusCode, err.message);
    }

    // Unexpected errors
    logger.error(`Unhandled error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      requestId: req.requestId,
    });
    return sendError(res, 500, 'Internal server error');
  };
}
