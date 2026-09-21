import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient; sqliteOptimized?: boolean };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Optimize SQLite for high-speed concurrent reads and writes
if (!globalForPrisma.sqliteOptimized) {
  globalForPrisma.sqliteOptimized = true;
  Promise.all([
    db.$queryRawUnsafe('PRAGMA journal_mode = WAL;'),
    db.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'),
    db.$queryRawUnsafe('PRAGMA temp_store = MEMORY;'),
    db.$queryRawUnsafe('PRAGMA cache_size = -64000;'),
    db.$queryRawUnsafe('PRAGMA foreign_keys = ON;'),
  ]).catch(() => {});
}

