import { PrismaClient } from '@prisma/client';
import { env } from '../config';

// Singleton Prisma client with query logging in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
