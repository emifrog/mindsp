import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  const start = Date.now();

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error" };
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    const { CacheService } = await import("@/lib/cache");
    await CacheService.set("health:ping", "pong", { ttl: 10 });
    const val = await CacheService.get<string>("health:ping");
    checks.redis = {
      status: val === "pong" ? "ok" : "error",
      latency: Date.now() - redisStart,
    };
  } catch {
    checks.redis = { status: "error" };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latency: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
