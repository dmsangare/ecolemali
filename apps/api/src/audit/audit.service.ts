import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess, schoolWhere } from "../common/utils";

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

  async findOne(id: string, user: CurrentUserPayload) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException("Entree d audit introuvable");
    assertSchoolAccess(user, log.schoolId, "Entree d audit introuvable");
    return log;
  }

  async findByObject(objectType: string, objectId: string, user: CurrentUserPayload) {
    return this.prisma.auditLog.findMany({
      where: { objectType, objectId, ...schoolWhere(user) },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUser(userId: string, user: CurrentUserPayload, page = 1, limit = 20) {
    const where = { userId, ...schoolWhere(user) };
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
}
