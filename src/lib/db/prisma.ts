import { PrismaClient } from '@prisma/client';

/**
 * The single PrismaClient for the whole app — the one door to stored state.
 *
 * Next.js re-evaluates server modules on every hot reload in development; a fresh
 * client per reload would leak connections until Postgres refuses new ones. We
 * therefore cache one instance on `globalThis` in dev. In production the module is
 * evaluated once, so a plain singleton suffices. Every server module imports this
 * rather than constructing its own client (SSOT for DB access).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
