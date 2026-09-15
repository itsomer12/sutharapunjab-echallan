import { PrismaClient } from '../../prisma/generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Use node-pg driver for Prisma v7
// Keep each Vercel function instance to one database connection; DATABASE_URL
// should point to the managed provider's pooled/serverless endpoint.
const pool = globalForPrisma.pool ?? new pg.Pool({
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
