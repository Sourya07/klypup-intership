import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { prisma } from '../lib';
import { UnauthorizedError } from '../utils/errors';
import { UserRole } from '@prisma/client';

// Extend Express Request with authenticated user context
export interface AuthUser {
  userId: string;
  orgId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  orgId: string;
  role: UserRole;
  email: string;
}

// Verify JWT and attach user context to request
export function authenticate() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
      }

      const token = header.split(' ')[1];
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      // Verify membership still exists (handles removed users)
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: payload.userId, organizationId: payload.orgId } },
      });

      if (!membership) {
        throw new UnauthorizedError('User is no longer a member of this organization');
      }

      req.user = {
        userId: payload.userId,
        orgId: payload.orgId,
        role: membership.role,
        email: payload.email,
      };

      next();
    } catch (err) {
      if (err instanceof UnauthorizedError) return next(err);
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}

// Role-based access control
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions for this action'));
    }
    next();
  };
}
