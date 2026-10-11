import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ListTemplatesQuery, ListReportsQuery } from './dto';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // RAP-01 : Référentiel des modèles
  // ============================================================

  async listTemplates(schoolId: string, query: ListTemplatesQuery) {
    const where: any = {
      OR: [{ schoolId }, { schoolId: null }],
    };
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.activeOnly) where.isActive = true;

    const templates = await this.prisma.adminReportTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { code: 'asc' }, { version: 'desc' }],
    });

    return { data: templates };
  }

  async getTemplate(schoolId: string, id: string) {
    const template = await this.prisma.adminReportTemplate.findFirst({
      where: {
        id,
        OR: [{ schoolId }, { schoolId: null }],
      },
    });
    if (!template) throw new NotFoundException('Modèle introuvable');
    return { data: template };
  }

  // ============================================================
  // Liste des rapports (instances)
  // ============================================================

  async listReports(schoolId: string, query: ListReportsQuery) {
    const where: any = { schoolId };
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    const reports = await this.prisma.adminReport.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    return { data: reports };
  }

  async getReport(schoolId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
      include: {
        template: true,
        versions: { orderBy: { version: 'desc' } },
        transmissions: { orderBy: { sentAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    return { data: report };
  }
}
