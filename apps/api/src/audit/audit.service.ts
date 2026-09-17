import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, filters: {
    userId?: string; module?: string; action?: string; objectType?: string; objectId?: string;
    fromDate?: string; toDate?: string;
  } = {}) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.objectType) where.objectType = filters.objectType;
    if (filters.objectId) where.objectId = filters.objectId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException("Entree d audit introuvable");
    return log;
  }

  async findByObject(objectType: string, objectId: string) {
    return this.prisma.auditLog.findMany({
      where: { objectType, objectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
