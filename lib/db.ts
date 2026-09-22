import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient; sqliteOptimized?: boolean };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// High-speed SQLite Optimization for sub-millisecond database queries
if (!globalForPrisma.sqliteOptimized && process.env.NODE_ENV !== 'test') {
  globalForPrisma.sqliteOptimized = true;
  (async () => {
    try {
      await db.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
      await db.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
      await db.$queryRawUnsafe('PRAGMA temp_store = MEMORY;');
      await db.$queryRawUnsafe('PRAGMA cache_size = -64000;');
      await db.$queryRawUnsafe('PRAGMA mmap_size = 268435456;');
      await db.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
      await db.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch {}
  })();
}


