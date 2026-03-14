import { PrismaClient } from "@prisma/client";

const SLOW_QUERY_THRESHOLD_MS = 500;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Middleware pour détecter les requêtes lentes
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    console.warn(
      `[SLOW QUERY] ${params.model}.${params.action} took ${duration}ms`,
      params.args ? JSON.stringify(params.args).slice(0, 200) : ""
    );
  }

  return result;
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
