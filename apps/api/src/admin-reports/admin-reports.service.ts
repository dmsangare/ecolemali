import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminReportTemplatesSeed } from './admin-report-templates.seed';
import { ReportDataBuilder } from './report-data.builder';
import type { ListTemplatesQuery, ListReportsQuery } from './dto';

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seed: AdminReportTemplatesSeed,
    private readonly builder: ReportDataBuilder,
  ) {}

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
      where: { id, OR: [{ schoolId }, { schoolId: null }] },
    });
    if (!template) throw new NotFoundException('Modèle introuvable');
    return { data: template };
  }

  async ensureSeed() {
    return this.seed.ensureGlobalTemplates();
  }

  // ============================================================
  // Rapports (instances)
  // ============================================================

  async listReports(schoolId: string, query: ListReportsQuery) {
    const where: any = { schoolId };
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    const reports = await this.prisma.adminReport.findMany({
      where,
      include: {
        template: { select: { code: true, title: true, category: true } },
      },
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

  async createReport(
    schoolId: string,
    userId: string,
    body: { templateCode: string; academicYearId?: string; title?: string; periodLabel?: string; referenceDate?: string },
  ) {
    if (!body.templateCode) throw new BadRequestException('templateCode requis');

    const template = await this.prisma.adminReportTemplate.findFirst({
      where: {
        code: body.templateCode,
        version: 1,
        OR: [{ schoolId }, { schoolId: null }],
      },
    });
    if (!template) throw new NotFoundException('Modèle introuvable');

    const created = await this.prisma.adminReport.create({
      data: {
        schoolId,
        templateId: template.id,
        academicYearId: body.academicYearId,
        code: body.templateCode,
        title: body.title || template.title,
        status: 'BROUILLON',
        periodLabel: body.periodLabel,
        referenceDate: body.referenceDate ? new Date(body.referenceDate) : null,
        data: {},
        createdBy: userId,
      },
    });

    await this.prisma.adminReportAuditLog.create({
      data: {
        reportId: created.id,
        action: 'CREATION',
        userId,
        details: { templateCode: body.templateCode },
      },
    });

    return { data: created };
  }

  async generateReport(schoolId: string, userId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'BROUILLON') {
      throw new BadRequestException('Seul un brouillon peut être regénéré');
    }
    if (!report.academicYearId) {
      throw new BadRequestException('Année scolaire requise sur le rapport');
    }

    let data: any;
    switch (report.code) {
      case 'RAP-02':
        data = await this.builder.buildRentree(schoolId, report.academicYearId);
        break;
      case 'RAP-03':
        data = await this.builder.buildStats(schoolId, report.academicYearId);
        break;
      case 'RAP-04':
        data = await this.builder.buildPersonnel(schoolId, report.academicYearId);
        break;
      default:
        throw new BadRequestException(`Pré-remplissage non implémenté pour ${report.code}`);
    }

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: { data },
    });

    await this.prisma.adminReportAuditLog.create({
      data: { reportId: id, action: 'GENERATE', userId },
    });

    return { data: updated };
  }

  async patchReport(
    schoolId: string,
    userId: string,
    id: string,
    patch: { title?: string; periodLabel?: string; referenceDate?: string; data?: any },
  ) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'BROUILLON') {
      throw new BadRequestException('Seul un brouillon peut être modifié');
    }

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: {
        title: patch.title ?? undefined,
        periodLabel: patch.periodLabel ?? undefined,
        referenceDate: patch.referenceDate ? new Date(patch.referenceDate) : undefined,
        data: patch.data ?? undefined,
      },
    });

    await this.prisma.adminReportAuditLog.create({
      data: { reportId: id, action: 'PATCH', userId, details: { fields: Object.keys(patch) } },
    });

    return { data: updated };
  }
}
