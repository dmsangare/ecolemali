import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Construit les données factuelles d'un rapport à partir de la base.
 * Ne stocke rien — retourne un objet JSON prêt à mettre dans AdminReport.data.
 */
@Injectable()
export class ReportDataBuilder {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // RAP-02 : Rapport de rentrée scolaire
  // ============================================================

  async buildRentree(schoolId: string, academicYearId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true, name: true, code: true, sigle: true, type: true, status: true,
        address: true, region: true, cercle: true, commune: true, quarter: true,
        phone: true, email: true, website: true,
        directorName: true, motto: true,
        academy: true, cap: true, institutionalCode: true,
      },
    });

    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, startDate: true, endDate: true, status: true, isCurrent: true },
    });

    const classes = await this.prisma.class.findMany({
      where: { schoolId, academicYearId },
      include: {
        level: true,
      },
      orderBy: [{ level: { orderIndex: 'asc' } }, { name: 'asc' }],
    });

    // Effectifs par classe
    const classesStats = await Promise.all(
      classes.map(async (cls) => {
        const [total, girls, boys] = await Promise.all([
          this.prisma.enrollment.count({
            where: { classId: cls.id, academicYearId, status: 'VALIDATED' },
          }),
          this.prisma.enrollment.count({
            where: {
              classId: cls.id, academicYearId, status: 'VALIDATED',
              student: { gender: 'F' },
            },
          }),
          this.prisma.enrollment.count({
            where: {
              classId: cls.id, academicYearId, status: 'VALIDATED',
              student: { gender: 'M' },
            },
          }),
        ]);

        return {
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          levelName: cls.level.name,
          cycle: cls.level.cycle,
          capacity: cls.capacity,
          total, girls, boys,
          repeating: 0, // à brancher plus tard (source : StudentPathway)
        };
      }),
    );

    // Agrégats
    const totalStudents = classesStats.reduce((s, c) => s + c.total, 0);
    const totalGirls = classesStats.reduce((s, c) => s + c.girls, 0);
    const totalBoys = classesStats.reduce((s, c) => s + c.boys, 0);
    const classesCount = classes.length;

    // Par cycle
    const byCycle: Record<string, { classes: number; total: number; girls: number; boys: number }> = {};
    for (const c of classesStats) {
      const k = c.cycle;
      byCycle[k] ??= { classes: 0, total: 0, girls: 0, boys: 0 };
      byCycle[k].classes += 1;
      byCycle[k].total += c.total;
      byCycle[k].girls += c.girls;
      byCycle[k].boys += c.boys;
    }

    return {
      identification: {
        school: {
          name: school?.name,
          code: school?.code,
          sigle: school?.sigle,
          type: school?.type,
          status: school?.status,
          address: school?.address,
          region: school?.region,
          cercle: school?.cercle,
          commune: school?.commune,
          quarter: school?.quarter,
          phone: school?.phone,
          email: school?.email,
          website: school?.website,
          directorName: school?.directorName,
          motto: school?.motto,
          academy: school?.academy,
          cap: school?.cap,
          institutionalCode: school?.institutionalCode,
        },
        academicYear: year,
        referenceDate: new Date().toISOString().split('T')[0],
      },
      synthese: {
        totalStudents,
        totalGirls,
        totalBoys,
        classesCount,
      },
      classes: classesStats,
      parCycle: byCycle,
    };
  }

  // ============================================================
  // RAP-03 : Rapport statistique des effectifs
  // ============================================================

  async buildStats(schoolId: string, academicYearId: string) {
    const base = await this.buildRentree(schoolId, academicYearId);

    // Par niveau
    const byLevel: Record<string, { total: number; girls: number; boys: number; classes: number }> = {};
    for (const c of base.classes) {
      const k = c.levelName;
      byLevel[k] ??= { total: 0, girls: 0, boys: 0, classes: 0 };
      byLevel[k].total += c.total;
      byLevel[k].girls += c.girls;
      byLevel[k].boys += c.boys;
      byLevel[k].classes += 1;
    }

    return {
      reference: base.identification,
      synthese: base.synthese,
      effectifsParClasse: base.classes,
      effectifsParNiveau: byLevel,
      repartitionParCycle: base.parCycle,
      repartitionParSexe: {
        filles: base.synthese.totalGirls,
        garcons: base.synthese.totalBoys,
        total: base.synthese.totalStudents,
      },
    };
  }
}
