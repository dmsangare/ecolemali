import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../common/decorators";

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: { status: "ok" | "down"; latencyMs?: number; error?: string };
    redis: { status: "ok" | "down"; latencyMs?: number; error?: string };
    storage: { status: "ok" | "down"; error?: string };
  };
}

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Healthcheck global (DB, Redis, Storage)" })
  async check(): Promise<HealthStatus> {
    const checks: HealthStatus["checks"] = {
      database: { status: "down" },
      redis: { status: "down" },
      storage: { status: "down" },
    };

    // 1. PostgreSQL
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latencyMs: Date.now() - start };
    } catch (err: any) {
      checks.database = { status: "down", error: err.message?.slice(0, 200) };
    }

    // 2. Redis (via env URL + test TCP simple)
    try {
      const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
      const host = redisUrl.split("@")[1]?.split(":")[0] || "redis";
      const port = Number(redisUrl.split(":").pop()) || 6379;

      const net = await import("net");
      const start = Date.now();
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port, host, () => {
          socket.end();
          resolve();
        });
        socket.setTimeout(2000);
        socket.on("error", reject);
        socket.on("timeout", () => {
          socket.destroy();
          reject(new Error("Redis timeout"));
        });
      });
      checks.redis = { status: "ok", latencyMs: Date.now() - start };
    } catch (err: any) {
      checks.redis = { status: "down", error: err.message?.slice(0, 200) };
    }

    // 3. Storage
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const storageRoot = process.env.STORAGE_ROOT || "/app/storage";
      await fs.access(path.join(storageRoot, "documents"));
      checks.storage = { status: "ok" };
    } catch (err: any) {
      checks.storage = { status: "down", error: err.message?.slice(0, 200) };
    }

    const allOk = Object.values(checks).every((c) => c.status === "ok");
    const anyDown =
      checks.database.status === "down" || checks.redis.status === "down";

    return {
      status: allOk ? "ok" : anyDown ? "down" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.APP_VERSION || "1.0.0",
      checks,
    };
  }
}
