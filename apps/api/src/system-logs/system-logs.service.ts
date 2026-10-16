import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SystemLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    level?: string;
    module?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.level) where.level = filters.level;
    if (filters.module) where.module = filters.module;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    // BigInt -> string pour la serialisation JSON
    const safeItems = items.map((it) => ({
      ...it,
      id: it.id.toString(),
    }));

    return {
      items: safeItems,
      total,
      page,
      limit,
    };
  }
}
