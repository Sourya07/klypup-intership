import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

// Validate request body, query, or params against a Zod schema
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }
    // Replace with parsed (coerced/defaulted) data
    req[source] = result.data;
    next();
  };
}
