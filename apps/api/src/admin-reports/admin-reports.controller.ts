import {
  Controller, Get, Post, Patch, Body, Param, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminReportsService } from './admin-reports.service';
import { generateReportPDF } from '../reports/pdf/report-pdf.util';
import { generateExcel } from '../students/utils/excel.util';
import { ListTemplatesQuerySchema, ListReportsQuerySchema } from './dto';

@Controller('admin-reports')
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  private sid(req: any): string { return req.user.schoolId; }
  private uid(req: any): string { return req.user.id ?? req.user.userId; }

  @Get('health')
  health() { return { status: 'ok', module: 'admin-reports' }; }

  @Post('seed')
  async seed() { return this.service.ensureSeed(); }

  // --- Templates ---
  @Get('templates')
  async listTemplates(@Req() req: any, @Query() query: any) {
    return this.service.listTemplates(this.sid(req), ListTemplatesQuerySchema.parse(query));
  }

  @Get('templates/:id')
  async getTemplate(@Req() req: any, @Param('id') id: string) {
    return this.service.getTemplate(this.sid(req), id);
  }

  // --- Reports ---
  @Get('reports')
  async listReports(@Req() req: any, @Query() query: any) {
    return this.service.listReports(this.sid(req), ListReportsQuerySchema.parse(query));
  }

  @Get('reports/:id')
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.service.getReport(this.sid(req), id);
  }

  @Post('reports')
  async createReport(@Req() req: any, @Body() body: any) {
    return this.service.createReport(this.sid(req), this.uid(req), body);
  }

  @Post('reports/:id/generate')
  async generate(@Req() req: any, @Param('id') id: string) {
    return this.service.generateReport(this.sid(req), this.uid(req), id);
  }

  @Patch('reports/:id')
  async patch(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.patchReport(this.sid(req), this.uid(req), id, body);
  }

  // ============================================================
  // Export PDF
  // ============================================================

  @Get('reports/:id/pdf')
  async pdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const { data: report } = await this.service.getReport(this.sid(req), id);
    const schoolName = report.template?.title ?? report.title;
    const userName = `${req.user.firstName ?? ''} ${req.user.lastName ?? ''}`.trim() || 'Utilisateur';

    const sections = this.buildPdfSections(report);
    const summary = this.buildPdfSummary(report);

    const pdf = await generateReportPDF({
      title: report.title,
      schoolName: req.user.schoolName ?? 'Établissement',
      subtitle: `${report.code} — ${schoolName}`,
      period: report.periodLabel ?? undefined,
      user: userName,
      summary,
      sections,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${report.code}-${report.id.slice(0, 8)}.pdf"`,
    );
    res.send(pdf);
  }

  // ============================================================
  // Export Excel
  // ============================================================

  @Get('reports/:id/excel')
  async excel(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const { data: report } = await this.service.getReport(this.sid(req), id);
    const data = (report.data as any) ?? {};
    const classes: any[] = data.classes ?? data.effectifsParClasse ?? [];

    const excel = await generateExcel({
      title: report.title,
      subtitle: `${report.code} — ${report.periodLabel ?? ''}`,
      sheetName: 'Effectifs',
      schoolName: req.user.schoolName ?? 'Établissement',
      columns: [
        { header: 'Classe', key: 'className', width: 20 },
        { header: 'Niveau', key: 'levelName', width: 15 },
        { header: 'Cycle', key: 'cycle', width: 20 },
        { header: 'Capacité', key: 'capacity', width: 12 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Filles', key: 'girls', width: 10 },
        { header: 'Garçons', key: 'boys', width: 10 },
      ],
      data: classes.map((c) => ({
        className: c.className,
        levelName: c.levelName,
        cycle: c.cycle,
        capacity: c.capacity ?? '',
        total: c.total,
        girls: c.girls,
        boys: c.boys,
      })),
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.code}-${report.id.slice(0, 8)}.xlsx"`,
    );
    res.send(excel);
  }

  // ============================================================
  // Helpers de transformation
  // ============================================================

  private buildPdfSummary(report: any): Array<{ label: string; value: string | number }> {
    const d = (report.data as any) ?? {};
    const s = d.synthese ?? {};

    // RAP-04 : personnel
    if (report.code === 'RAP-04') {
      return [
        { label: 'Enseignants', value: s.totalTeachers ?? 0 },
        { label: 'Personnel administratif', value: s.totalAdmin ?? 0 },
        { label: 'Enseignantes (F)', value: s.teachersByGender?.filles ?? 0 },
        { label: 'Enseignants (M)', value: s.teachersByGender?.garcons ?? 0 },
      ];
    }

    // Par defaut : effectifs eleves (RAP-02, RAP-03)
    return [
      { label: 'Élèves inscrits', value: s.totalStudents ?? 0 },
      { label: 'Filles', value: s.totalGirls ?? 0 },
      { label: 'Garçons', value: s.totalBoys ?? 0 },
      { label: 'Classes ouvertes', value: s.classesCount ?? 0 },
    ];
  }

  private buildPdfSections(report: any): Array<{ title: string; rows: any[]; columns: any[] }> {
    const d = (report.data as any) ?? {};
    const sections: Array<{ title: string; rows: any[]; columns: any[] }> = [];

    // Section : infos ecole
    const school = d.identification?.school ?? d.reference?.school;
    if (school) {
      sections.push({
        title: 'Identification de l\'établissement',
        rows: [
          { label: 'Nom', value: school.name ?? '—' },
          { label: 'Code', value: school.code ?? '—' },
          { label: 'Type', value: school.type ?? '—' },
          { label: 'Région', value: school.region ?? '—' },
          { label: 'CAP', value: school.cap ?? '—' },
          { label: 'Académie', value: school.academy ?? '—' },
          { label: 'Directeur', value: school.directorName ?? '—' },
        ],
        columns: [
          { key: 'label', label: 'Champ' },
          { key: 'value', label: 'Valeur' },
        ],
      });
    }

    // Section : effectifs par classe
    const classes = d.classes ?? d.effectifsParClasse;
    if (Array.isArray(classes) && classes.length > 0) {
      sections.push({
        title: 'Effectifs par classe',
        rows: classes,
        columns: [
          { key: 'className', label: 'Classe' },
          { key: 'levelName', label: 'Niveau' },
          { key: 'total', label: 'Total', align: 'right' },
          { key: 'girls', label: 'Filles', align: 'right' },
          { key: 'boys', label: 'Garçons', align: 'right' },
        ],
      });
    }

    // Section : repartition par cycle
    const cycles = d.parCycle ?? d.repartitionParCycle;
    if (cycles && typeof cycles === 'object') {
      const rows = Object.entries(cycles).map(([k, v]: any) => ({
        cycle: k,
        classes: v.classes,
        total: v.total,
        girls: v.girls,
        boys: v.boys,
      }));
      sections.push({
        title: 'Répartition par cycle',
        rows,
        columns: [
          { key: 'cycle', label: 'Cycle' },
          { key: 'classes', label: 'Classes', align: 'right' },
          { key: 'total', label: 'Total', align: 'right' },
          { key: 'girls', label: 'Filles', align: 'right' },
          { key: 'boys', label: 'Garçons', align: 'right' },
        ],
      });
    }

    // ============================================================
    // RAP-04 : personnel
    // ============================================================
    if (report.code === 'RAP-04') {
      // Section : liste des enseignants
      if (Array.isArray(d.enseignants) && d.enseignants.length > 0) {
        sections.push({
          title: 'Liste des enseignants',
          rows: d.enseignants.map((t: any) => ({
            matricule: t.matricule,
            nom: t.fullName,
            diplome: t.diploma ?? '—',
            contrat: t.contractType ?? '—',
            matieres: (t.subjects ?? []).join(', '),
          })),
          columns: [
            { key: 'matricule', label: 'Matricule' },
            { key: 'nom', label: 'Nom' },
            { key: 'diplome', label: 'Diplôme' },
            { key: 'contrat', label: 'Contrat' },
            { key: 'matieres', label: 'Matières' },
          ],
        });
      }

      // Section : repartition par matiere
      if (d.repartitionParMatiere && typeof d.repartitionParMatiere === 'object') {
        const rows = Object.entries(d.repartitionParMatiere).map(([k, v]) => ({
          matiere: k,
          count: v,
        }));
        sections.push({
          title: 'Répartition des enseignants par matière',
          rows,
          columns: [
            { key: 'matiere', label: 'Matière' },
            { key: 'count', label: 'Nb enseignants', align: 'right' },
          ],
        });
      }

      // Section : repartition par diplome
      if (d.repartitionParDiplome && typeof d.repartitionParDiplome === 'object') {
        const rows = Object.entries(d.repartitionParDiplome).map(([k, v]) => ({
          diplome: k,
          count: v,
        }));
        sections.push({
          title: 'Répartition par diplôme',
          rows,
          columns: [
            { key: 'diplome', label: 'Diplôme' },
            { key: 'count', label: 'Nb', align: 'right' },
          ],
        });
      }

      // Section : personnel administratif
      if (Array.isArray(d.personnelAdministratif) && d.personnelAdministratif.length > 0) {
        sections.push({
          title: 'Personnel administratif',
          rows: d.personnelAdministratif.map((u: any) => ({
            nom: u.fullName,
            roles: (u.roles ?? []).join(', '),
            email: u.email ?? '—',
            phone: u.phone ?? '—',
          })),
          columns: [
            { key: 'nom', label: 'Nom' },
            { key: 'roles', label: 'Rôle(s)' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Téléphone' },
          ],
        });
      }

      return sections;
    }

    return sections;
  }
}
