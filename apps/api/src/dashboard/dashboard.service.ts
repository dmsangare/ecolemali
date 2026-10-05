import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalcule le Top 3 (tableau d'honneur) pour une école et un trimestre donnés.
   * Appelée automatiquement après la génération/modification d'un bulletin.
   *
   * Pour chaque cycle (PREMIER_CYCLE, DEUXIEME_CYCLE, LYCEE) :
   *  - Récupère tous les ReportCard PUBLISHED du term pour ce cycle
   *  - Trie par moyenne DESC
   *  - Prend le top 3
   *  - Écrit dans la table top_students
   */
  async recomputeTopStudents(
    schoolId: string,
    termId?: string,
  ): Promise<{ updated: number }> {
    // 1. Déterminer le trimestre
    let term;
    if (termId) {
      term = await this.prisma.term.findUnique({ where: { id: termId } });
    } else {
      // Prendre le trimestre actif (aujourd'hui entre startDate et endDate)
      const today = new Date();
      term = await this.prisma.term.findFirst({
        where: {
          academicYear: { schoolId, isCurrent: true },
          startDate: { lte: today },
          endDate: { gte: today },
        },
        orderBy: { orderIndex: "asc" },
      });
    }

    if (!term) {
      this.logger.warn(
        `Aucun trimestre actif pour l'ecole ${schoolId}. Recalcul ignore.`,
      );
      return { updated: 0 };
    }

    // 2. Récupérer tous les ReportCard PUBLISHED du trimestre
    const reportCards = await this.prisma.reportCard.findMany({
      where: {
        termId: term.id,
        status: "PUBLISHED",
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            level: { select: { cycle: true, name: true } },
          },
        },
      },
    });

    if (reportCards.length === 0) {
      this.logger.log(
        `Aucun bulletin publie pour le term ${term.id}. Recalcul ignore.`,
      );
      return { updated: 0 };
    }

    // 3. Grouper par cycle
    const byCycle: Record<string, typeof reportCards> = {
      PREMIER_CYCLE: [],
      DEUXIEME_CYCLE: [],
      LYCEE: [],
    };

    for (const rc of reportCards) {
      const cycle = rc.class.level?.cycle;
      if (cycle && byCycle[cycle] && rc.average !== null) {
        byCycle[cycle].push(rc);
      }
    }

    // 4. Pour chaque cycle, trier et prendre le top 3
    const periodLabel = `${term.name} - ${(await this.getYearLabel(schoolId)) ?? ""}`.trim();
    const periodType =
      term.type === "TRIMESTRE" ? "TRIMESTRE" : "SEMESTRE";

    let totalUpdated = 0;

    for (const [cycle, cards] of Object.entries(byCycle)) {
      if (cards.length === 0) continue;

      // Trier par moyenne desc
      const sorted = [...cards].sort((a, b) => {
        const avgA = Number(a.average ?? 0);
        const avgB = Number(b.average ?? 0);
        return avgB - avgA;
      });

      const top3 = sorted.slice(0, 3);

      // Supprimer l'ancien classement pour ce cycle/periodLabel
      await this.prisma.topStudent.deleteMany({
        where: { schoolId, cycle: cycle as any, periodLabel },
      });

      // Inserer le nouveau
      for (let i = 0; i < top3.length; i++) {
        const rc = top3[i];
        await this.prisma.topStudent.create({
          data: {
            schoolId,
            cycle: cycle as any,
            periodType,
            periodLabel,
            termId: term.id,
            rank: i + 1,
            studentId: rc.studentId,
            classId: rc.classId,
            average: rc.average as any,
            scale: 20,
          },
        });
        totalUpdated++;
      }
    }

    this.logger.log(
      `Top students recalcule : ${totalUpdated} eleves mis a jour (term ${term.id})`,
    );

    return { updated: totalUpdated };
  }

  /**
   * Retourne le top 3 pour chaque cycle (visible par tous).
   */
  async getTopStudents(schoolId: string, termId?: string) {
    let term;
    if (termId) {
      term = await this.prisma.term.findUnique({ where: { id: termId } });
    } else {
      const today = new Date();
      term = await this.prisma.term.findFirst({
        where: {
          academicYear: { schoolId, isCurrent: true },
          startDate: { lte: today },
          endDate: { gte: today },
        },
        orderBy: { orderIndex: "asc" },
      });
    }

    if (!term) {
      return {
        term: null,
        podiums: { PREMIER_CYCLE: [], DEUXIEME_CYCLE: [], LYCEE: [] },
      };
    }

    const rows = await this.prisma.topStudent.findMany({
      where: { schoolId, termId: term.id },
      orderBy: [{ cycle: "asc" }, { rank: "asc" }],
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        class: {
          select: { id: true, name: true },
        },
      },
    });

    const podiums: Record<string, any[]> = {
      PREMIER_CYCLE: [],
      DEUXIEME_CYCLE: [],
      LYCEE: [],
    };

    for (const row of rows) {
      podiums[row.cycle].push({
        rank: row.rank,
        average: Number(row.average),
        scale: row.scale,
        student: row.student,
        class: row.class,
      });
    }

    return {
      term: {
        id: term.id,
        name: term.name,
        type: term.type,
        startDate: term.startDate,
        endDate: term.endDate,
      },
      podiums,
    };
  }

  /**
   * Retourne les donnees du dashboard pour un enseignant.
   */
  async getTeacherDashboard(userId: string, schoolId: string) {
    // 1. Trouver le Teacher associe a cet utilisateur
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return {
        hasProfile: false,
        message: "Aucun profil enseignant associe",
      };
    }

    // 2. Ses assignments (classes + matieres) pour l'annee en cours
    const year = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    const assignments = year
      ? await this.prisma.teacherAssignment.findMany({
          where: { teacherId: teacher.id, academicYearId: year.id },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: { select: { id: true, name: true, cycle: true } },
                _count: { select: { enrollments: true } },
              },
            },
            subject: { select: { id: true, name: true, code: true } },
          },
        })
      : [];

    // 3. Classes uniques
    const classesMap = new Map<string, any>();
    for (const a of assignments) {
      if (!classesMap.has(a.classId)) {
        classesMap.set(a.classId, {
          id: a.class.id,
          name: a.class.name,
          level: a.class.level,
          studentCount: a.class._count.enrollments,
        });
      }
    }
    const myClasses = Array.from(classesMap.values());

    // 4. Matieres uniques
    const subjectsMap = new Map<string, any>();
    for (const a of assignments) {
      if (!subjectsMap.has(a.subjectId)) {
        subjectsMap.set(a.subjectId, a.subject);
      }
    }
    const mySubjects = Array.from(subjectsMap.values());

    // 5. Total eleves
    const totalStudents = myClasses.reduce(
      (sum, c) => sum + (c.studentCount || 0),
      0,
    );

    // 6. Evaluations a venir (7 jours)
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const upcomingAssessments = await this.prisma.assessment.findMany({
      where: {
        teacherId: teacher.id,
        schoolId,
        date: { gte: today, lte: in7Days },
      },
      orderBy: { date: "asc" },
      take: 10,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    // 7. Notes a saisir (assessments sans notes)
    const pendingAssessments = await this.prisma.assessment.findMany({
      where: {
        teacherId: teacher.id,
        schoolId,
        status: { in: ["DRAFT", "OPEN"] },
      },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { grades: true } },
      },
    });

    return {
      hasProfile: true,
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        matricule: teacher.matricule,
      },
      myClasses,
      mySubjects,
      totalStudents,
      upcomingAssessments,
      pendingAssessments,
    };
  }

  /**
   * Retourne les donnees du dashboard pour un surveillant.
   */
  async getSupervisorDashboard(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    // Sessions de presence du jour
    const todaySessions = year
      ? await this.prisma.attendanceSession.count({
          where: {
            date: today,
            class: { academicYearId: year.id, schoolId },
          },
        })
      : 0;

    // Absents du jour
    const absents = await this.prisma.attendanceRecord.findMany({
      where: {
        status: "ABSENT",
        session: {
          date: today,
          class: { schoolId },
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        session: {
          select: {
            class: { select: { name: true } },
            startTime: true,
          },
        },
      },
      take: 20,
    });

    return {
      todaySessions,
      absentsCount: absents.length,
      absents,
    };
  }

  /**
   * Retourne les donnees du dashboard pour une secretaire.
   */
  async getSecretaryDashboard(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Inscriptions du jour
    const todayEnrollments = await this.prisma.enrollment.count({
      where: {
        student: { schoolId },
        enrollmentDate: { gte: today },
      },
    });

    // Derniers eleves inscrits
    const recentStudents = await this.prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        createdAt: true,
      },
    });

    // Total eleves actifs
    const totalStudents = await this.prisma.student.count({
      where: { schoolId, status: "ACTIVE" },
    });

    return {
      todayEnrollments,
      totalStudents,
      recentStudents,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async getYearLabel(schoolId: string): Promise<string | null> {
    const year = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { label: true },
    });
    return year?.label ?? null;
  }
}
