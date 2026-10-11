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

    return `${sigle}/${yearLabel}/${reportCode}-${seq}`;
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

  // ============================================================
  // RAP-12 : Archivage (CDC 16)
  // ============================================================

  async listArchives(
    schoolId: string,
    query: {
      academicYearId?: string;
      code?: string;
      status?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: any = {
      schoolId,
      status: {
        in: ['VALIDE', 'PRET_A_TRANSMETTRE', 'TRANSMIS', 'RECEPTION_CONFIRMEE', 'CLOTURE'],
      },
    };
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.code) where.code = query.code;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.validatedAt = {};
      if (query.from) where.validatedAt.gte = new Date(query.from);
      if (query.to) where.validatedAt.lte = new Date(query.to);
    }

    const reports = await this.prisma.adminReport.findMany({
      where,
      include: {
        academicYear: { select: { id: true, startDate: true, endDate: true } },
        transmissions: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ validatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return { data: reports };
  }

  async buildArchivesExportData(schoolId: string, academicYearId?: string) {
    const where: any = {
      schoolId,
      status: {
        in: ['VALIDE', 'PRET_A_TRANSMETTRE', 'TRANSMIS', 'RECEPTION_CONFIRMEE', 'CLOTURE'],
      },
    };
    if (academicYearId) where.academicYearId = academicYearId;

    const reports = await this.prisma.adminReport.findMany({
      where,
      include: {
        academicYear: { select: { startDate: true, endDate: true } },
        transmissions: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ validatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    // Format pour Excel
    return reports.map((r) => {
      const tr = r.transmissions[0];
      return {
        code: r.code,
        title: r.title,
        anneeScolaire: r.academicYear
          ? `${new Date(r.academicYear.startDate).getFullYear()}-${new Date(r.academicYear.endDate).getFullYear()}`
          : '—',
        statut: r.status,
        version: r.version,
        bordereau: r.bordereauNumber ?? '—',
        destinataire: tr?.recipient ?? '—',
        dateValidation: r.validatedAt
          ? new Date(r.validatedAt).toLocaleDateString('fr-FR')
          : '—',
        dateTransmission: tr?.sentAt
          ? new Date(tr.sentAt).toLocaleDateString('fr-FR')
          : '—',
      };
    });
  }

  // ============================================================
  // RAP-11 : Calendrier + echeances (CDC 15)
  // ============================================================

  async listDeadlines(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const deadlines = await this.prisma.adminReportDeadline.findMany({
      where,
      orderBy: [{ deadline: 'asc' }],
    });
    return { data: deadlines };
  }

  async listUpcomingDeadlines(schoolId: string, daysAhead = 30) {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + daysAhead);

    const deadlines = await this.prisma.adminReportDeadline.findMany({
      where: {
        schoolId,
        deadline: { gte: now, lte: until },
        status: { in: ['A_VENIR', 'EN_COURS'] },
      },
      orderBy: [{ deadline: 'asc' }],
    });
    return { data: deadlines };
  }

  async createDeadline(
    schoolId: string,
    input: {
      templateCode: string;
      title: string;
      academicYearId?: string;
      recipient?: string;
      prepareFrom?: string;
      deadline: string;
      source?: string;
      confidenceLevel?: string;
      responsibleUserId?: string;
    },
  ) {
    if (!input.templateCode || !input.title || !input.deadline) {
      throw new BadRequestException('templateCode, title et deadline requis');
    }

    const created = await this.prisma.adminReportDeadline.create({
      data: {
        schoolId,
        templateCode: input.templateCode,
        title: input.title,
        academicYearId: input.academicYearId,
        recipient: input.recipient,
        prepareFrom: input.prepareFrom ? new Date(input.prepareFrom) : null,
        deadline: new Date(input.deadline),
        source: input.source,
        confidenceLevel: input.confidenceLevel ?? 'A_CONFIRMER',
        responsibleUserId: input.responsibleUserId,
        status: 'A_VENIR',
      },
    });
    return { data: created };
  }

  async patchDeadline(
    schoolId: string,
    id: string,
    patch: {
      title?: string;
      recipient?: string;
      prepareFrom?: string;
      deadline?: string;
      source?: string;
      confidenceLevel?: string;
      responsibleUserId?: string;
      status?: string;
    },
  ) {
    const deadline = await this.prisma.adminReportDeadline.findFirst({
      where: { id, schoolId },
    });
    if (!deadline) throw new NotFoundException('Échéance introuvable');

    const updated = await this.prisma.adminReportDeadline.update({
      where: { id },
      data: {
        title: patch.title ?? undefined,
        recipient: patch.recipient ?? undefined,
        prepareFrom: patch.prepareFrom ? new Date(patch.prepareFrom) : undefined,
        deadline: patch.deadline ? new Date(patch.deadline) : undefined,
        source: patch.source ?? undefined,
        confidenceLevel: patch.confidenceLevel ?? undefined,
        responsibleUserId: patch.responsibleUserId ?? undefined,
        status: patch.status ?? undefined,
      },
    });
    return { data: updated };
  }

  async deleteDeadline(schoolId: string, id: string) {
    const deadline = await this.prisma.adminReportDeadline.findFirst({
      where: { id, schoolId },
    });
    if (!deadline) throw new NotFoundException('Échéance introuvable');

    await this.prisma.adminReportDeadline.delete({ where: { id } });
    return { data: { deleted: true } };
  }

  // ============================================================
  // RAP-13 : Tableau de bord (CDC 17)
  // ============================================================

  async getDashboard(schoolId: string, academicYearId?: string) {
    const yearFilter = academicYearId ? { academicYearId } : {};

    // 1. Compteurs par statut
    const statuses = [
      'BROUILLON',
      'EN_VERIFICATION',
      'VALIDE',
      'PRET_A_TRANSMETTRE',
      'TRANSMIS',
      'RECEPTION_CONFIRMEE',
      'A_CORRIGER',
      'CLOTURE',
    ] as const;

    const counts = await Promise.all(
      statuses.map(async (st) => ({
        status: st,
        count: await this.prisma.adminReport.count({
          where: { schoolId, status: st, ...yearFilter },
        }),
      })),
    );

    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c.status] = c.count;

    const totalReports = Object.values(countMap).reduce((s, n) => s + n, 0);
    const validatedOrTransmitted =
      (countMap['VALIDE'] ?? 0) +
      (countMap['TRANSMIS'] ?? 0) +
      (countMap['RECEPTION_CONFIRMEE'] ?? 0) +
      (countMap['CLOTURE'] ?? 0);

    // 2. Rapports en retard (echeance depassee sans transmission)
    const now = new Date();
    const overdueDeadlines = await this.prisma.adminReportDeadline.findMany({
      where: {
        schoolId,
        deadline: { lt: now },
        status: { notIn: ['TRANSMIS', 'CLOTURE'] },
        ...(academicYearId ? { academicYearId } : {}),
      },
      orderBy: [{ deadline: 'asc' }],
    });

    // 3. Prochaines echeances (30 jours)
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const upcomingDeadlines = await this.prisma.adminReportDeadline.findMany({
      where: {
        schoolId,
        deadline: { gte: now, lte: until },
        status: { in: ['A_VENIR', 'EN_COURS'] },
        ...(academicYearId ? { academicYearId } : {}),
      },
      orderBy: [{ deadline: 'asc' }],
      take: 10,
    });

    // 4. Dossiers d'examens incomplets
    const incompleteDossiers = await this.prisma.examDossier.findMany({
      where: {
        schoolId,
        status: { in: ['BROUILLON', 'PIECES_MANQUANTES', 'A_CORRIGER'] },
      },
      include: {
        class: { select: { name: true, code: true } },
        session: { select: { examType: true, label: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    });

    // 5. Taux d'achevement
    const completionRate =
      totalReports > 0
        ? Number(((validatedOrTransmitted / totalReports) * 100).toFixed(1))
        : 0;

    return {
      data: {
        counts: countMap,
        totals: {
          totalReports,
          validatedOrTransmitted,
          completionRate,
        },
        overdue: {
          count: overdueDeadlines.length,
          items: overdueDeadlines.slice(0, 10),
        },
        upcoming: {
          count: upcomingDeadlines.length,
          items: upcomingDeadlines,
        },
        incompleteExamDossiers: {
          count: incompleteDossiers.length,
          items: incompleteDossiers,
        },
      },
    };
  }

  // ============================================================
  // B15 : Mode institutionnel (CAP / Academie)
  // Desactive par defaut (CDC 4.4 / 4.5)
  // ============================================================

  async getInstitutionalStatus(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        academy: true,
        cap: true,
        institutionalCode: true,
        institutionalMode: true,
      },
    });
    if (!school) throw new NotFoundException('École introuvable');
    return { data: school };
  }

  async setInstitutionalMode(schoolId: string, enabled: boolean) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) throw new NotFoundException('École introuvable');

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: { institutionalMode: enabled },
      select: {
        id: true,
        name: true,
        institutionalMode: true,
        academy: true,
        cap: true,
      },
    });
    return { data: updated };
  }

  async getConsolidatedView(schoolId: string, academicYearId?: string) {
    // Verrou : acces uniquement si institutional_mode active
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { institutionalMode: true, name: true, academy: true, cap: true },
    });
    if (!school) throw new NotFoundException('École introuvable');
    if (!school.institutionalMode) {
      throw new BadRequestException(
        'Mode institutionnel désactivé. Activez-le pour accéder à la vue consolidée.',
      );
    }

    const yearFilter = academicYearId ? { academicYearId } : {};

    // Rapports transmis / receptionnes
    const transmittedReports = await this.prisma.adminReport.findMany({
      where: {
        schoolId,
        status: { in: ['TRANSMIS', 'RECEPTION_CONFIRMEE', 'CLOTURE'] },
        ...yearFilter,
      },
      include: {
        academicYear: { select: { startDate: true, endDate: true } },
        transmissions: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ validatedAt: 'desc' }],
    });

    // Resume par code de rapport
    const byCode: Record<string, { count: number; lastTransmission: string | null }> = {};
    for (const r of transmittedReports) {
      byCode[r.code] ??= { count: 0, lastTransmission: null };
      byCode[r.code].count += 1;
      const t = r.transmissions[0]?.sentAt;
      if (t && (!byCode[r.code].lastTransmission || t.toISOString() > byCode[r.code].lastTransmission!)) {
        byCode[r.code].lastTransmission = t.toISOString();
      }
    }

    return {
      data: {
        school: {
          name: school.name,
          academy: school.academy,
          cap: school.cap,
        },
        totals: {
          transmittedReports: transmittedReports.length,
          byCode,
        },
        reports: transmittedReports.map((r) => ({
          id: r.id,
          code: r.code,
          title: r.title,
          status: r.status,
          version: r.version,
          bordereau: r.bordereauNumber,
          validatedAt: r.validatedAt,
          lastTransmission: r.transmissions[0]?.sentAt ?? null,
          recipient: r.transmissions[0]?.recipient ?? null,
          academicYear: r.academicYear
            ? `${new Date(r.academicYear.startDate).getFullYear()}-${new Date(r.academicYear.endDate).getFullYear()}`
            : null,
        })),
      },
    };
  }
}
