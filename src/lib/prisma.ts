// Safe Prisma client that won't crash during Vercel build-time static analysis
// At build time, @prisma/client may not be fully generated or DATABASE_URL may be missing

let prisma: any;

function createPrismaClient() {
  try {
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch {
    // Return a safe proxy during build
    return new Proxy({}, {
      get: (_target, prop) => {
        if (prop === 'then') return undefined; // Prevent Promise-like behavior
        return new Proxy(() => Promise.resolve(null), {
          get: (_t, p) => {
            if (p === 'then') return undefined;
            return () => Promise.resolve(null);
          },
        });
      },
    });
  }
}

const globalForPrisma = globalThis as unknown as { prisma: any };
prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
