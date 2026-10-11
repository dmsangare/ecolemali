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
      case 'RAP-05':
        data = await this.builder.buildInfrastructures(schoolId, report.academicYearId);
        break;
      case 'RAP-06':
        data = await this.builder.buildAnnualSituation(schoolId, report.academicYearId);
        break;
      case 'RAP-07':
        data = await this.builder.buildYearEnd(schoolId, report.academicYearId);
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

  // ============================================================
  // RAP-09 : Validation + verrouillage + snapshot (CDC 13)
  // ============================================================

  async submitForVerification(schoolId: string, userId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'BROUILLON') {
      throw new BadRequestException('Seul un brouillon peut être soumis à vérification');
    }

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: { status: 'EN_VERIFICATION' },
    });

    await this.prisma.adminReportAuditLog.create({
      data: { reportId: id, action: 'SUBMIT', userId },
    });

    return { data: updated };
  }

  async validateReport(schoolId: string, userId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'EN_VERIFICATION' && report.status !== 'A_VALIDER') {
      throw new BadRequestException(
        'Seul un rapport EN_VERIFICATION ou A_VALIDER peut être validé',
      );
    }

    // Snapshot : on copie les donnees actuelles pour figer la version
    const snapshot = {
      data: report.data,
      capturedAt: new Date().toISOString(),
      capturedBy: userId,
      version: report.version,
    };

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: {
        status: 'VALIDE',
        snapshot: snapshot as any,
        validatedBy: userId,
        validatedAt: new Date(),
      },
    });

    // Enregistrer aussi dans admin_report_versions
    await this.prisma.adminReportVersion.create({
      data: {
        reportId: id,
        version: report.version,
        data: report.data as any,
        snapshot: snapshot as any,
        reason: 'Validation initiale',
        createdBy: userId,
      },
    });

    await this.prisma.adminReportAuditLog.create({
      data: { reportId: id, action: 'VALIDATE', userId, details: { version: report.version } },
    });

    return { data: updated };
  }

  async unlockReport(schoolId: string, userId: string, id: string, reason: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'VALIDE' && report.status !== 'TRANSMIS' && report.status !== 'RECEPTION_CONFIRMEE') {
      throw new BadRequestException('Seul un rapport validé ou transmis peut être déverrouillé');
    }
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('Motif de déverrouillage requis (min 5 caractères)');
    }

    const newVersion = report.version + 1;

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: {
        status: 'BROUILLON',
        version: newVersion,
        validatedBy: null,
        validatedAt: null,
      },
    });

    await this.prisma.adminReportAuditLog.create({
      data: {
        reportId: id,
        action: 'UNLOCK',
        userId,
        details: { fromVersion: report.version, toVersion: newVersion, reason },
      },
    });

    return { data: updated };
  }

  async listVersions(schoolId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
      select: { id: true, code: true, title: true, version: true, status: true },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');

    const versions = await this.prisma.adminReportVersion.findMany({
      where: { reportId: id },
      orderBy: { version: 'desc' },
    });

    return { data: { report, versions } };
  }

  // ============================================================
  // RAP-10 : Transmission + reception (CDC 14)
  // ============================================================

  private async generateBordereauNumber(
    schoolId: string,
    reportCode: string,
  ): Promise<string> {
    // Recuperer le sigle de l'ecole
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { sigle: true, code: true },
    });
    const sigle = (school?.sigle || school?.code || 'SCH').toUpperCase();

    // Recuperer l'annee scolaire courante
    const year = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { startDate: true },
    });
    const yearLabel = year?.startDate
      ? new Date(year.startDate).getFullYear()
      : new Date().getFullYear();

    // Compter les transmissions existantes pour cette ecole + ce code de rapport
    const count = await this.prisma.adminReportTransmission.count({
      where: {
        report: { schoolId, code: reportCode },
      },
    });
    const seq = String(count + 1).padStart(4, '0');

    return `${sigle}/${yearLabel}/RAP-${reportCode}-${seq}`;
  }

  async transmitReport(
    schoolId: string,
    userId: string,
    id: string,
    input: {
      recipient: string;
      recipientRole?: string;
      channel: 'DEPOT_PHYSIQUE' | 'COURRIER' | 'EMAIL_ADMIN' | 'PORTAIL_OFFICIEL' | 'API_OFFICIELLE';
      proofUrl?: string;
      referenceNumber?: string;
      observations?: string;
    },
  ) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');

    const allowed = ['VALIDE', 'PRET_A_TRANSMETTRE', 'A_CORRIGER'];
    if (!allowed.includes(report.status)) {
      throw new BadRequestException(
        `Impossible de transmettre depuis le statut ${report.status}. Validez d'abord le rapport.`,
      );
    }
    if (!input.recipient || input.recipient.trim().length < 3) {
      throw new BadRequestException('Destinataire requis (min 3 caractères)');
    }

    // Bordereau : reutiliser celui du rapport s'il existe, sinon generer
    let bordereau = report.bordereauNumber;
    if (!bordereau) {
      bordereau = await this.generateBordereauNumber(schoolId, report.code);
    }

    const transmission = await this.prisma.adminReportTransmission.create({
      data: {
        reportId: id,
        version: report.version,
        recipient: input.recipient,
        recipientRole: input.recipientRole,
        channel: input.channel,
        sentBy: userId,
        bordereauNumber: bordereau,
        referenceNumber: input.referenceNumber,
        proofUrl: input.proofUrl,
        observations: input.observations,
      },
    });

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: {
        status: 'TRANSMIS',
        bordereauNumber: bordereau,
      },
    });

    await this.prisma.adminReportAuditLog.create({
      data: {
        reportId: id,
        action: 'TRANSMIT',
        userId,
        details: { recipient: input.recipient, channel: input.channel, bordereau },
      },
    });

    return { data: { report: updated, transmission } };
  }

  async receiveReport(
    schoolId: string,
    userId: string,
    id: string,
    input: {
      transmissionId?: string;
      receiptUrl?: string;
      observations?: string;
    },
  ) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');
    if (report.status !== 'TRANSMIS') {
      throw new BadRequestException(
        'Seul un rapport TRANSMIS peut être marqué comme réceptionné',
      );
    }

    // Si transmissionId fourni → mettre a jour la transmission
    if (input.transmissionId) {
      const tr = await this.prisma.adminReportTransmission.findFirst({
        where: { id: input.transmissionId, reportId: id },
      });
      if (!tr) throw new NotFoundException('Transmission introuvable');
      await this.prisma.adminReportTransmission.update({
        where: { id: input.transmissionId },
        data: {
          acknowledgmentUrl: input.receiptUrl,
          observations: input.observations ?? tr.observations,
        },
      });
    }

    const updated = await this.prisma.adminReport.update({
      where: { id },
      data: { status: 'RECEPTION_CONFIRMEE' },
    });

    await this.prisma.adminReportAuditLog.create({
      data: {
        reportId: id,
        action: 'RECEIVE',
        userId,
        details: { receiptUrl: input.receiptUrl },
      },
    });

    return { data: updated };
  }

  async listTransmissions(schoolId: string, id: string) {
    const report = await this.prisma.adminReport.findFirst({
      where: { id, schoolId },
      select: { id: true, code: true, title: true, status: true, bordereauNumber: true },
    });
    if (!report) throw new NotFoundException('Rapport introuvable');

    const transmissions = await this.prisma.adminReportTransmission.findMany({
      where: { reportId: id },
      orderBy: { sentAt: 'desc' },
    });

    return { data: { report, transmissions } };
  }
}
