import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess } from "../common/utils";
import { SaveStateExamResultsDto } from "./dto";

type StateExamResult = "ADMIS" | "REFUSE" | "ABSENT" | "EN_ATTENTE";

@Injectable()
export class StateExamsService {
  private readonly logger = new Logger(StateExamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // LISTE — retourne les niveaux d'examen d'Etat + leurs eleves
  // ============================================================

  async listLevels(schoolId: string | null) {
    const where: any = { stateExamType: { not: "NONE" } };
    if (schoolId) where.schoolId = schoolId;

    const levels = await this.prisma.level.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: {
        _count: { select: { classes: true, enrollments: true } },
      },
    });

    return levels.map((l) => ({
      id: l.id,
      name: l.name,
      code: l.code,
      cycle: l.cycle,
      stateExamType: l.stateExamType,
      classesCount: l._count.classes,
      studentsCount: l._count.enrollments,
    }));
  }

  // ============================================================
  // LISTE ELEVES — pour un niveau et une annee
  // ============================================================

  async listCandidates(
    levelId: string,
    academicYearId: string,
    user: CurrentUserPayload,
  ) {
    const level = await this.prisma.level.findUnique({
      where: { id: levelId },
    });
    if (!level) throw new NotFoundException("Niveau introuvable");
    assertSchoolAccess(user, level.schoolId, "Niveau introuvable");

    // Charger les eleves inscrits ce niveau/annee
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        levelId,
        academicYearId,
        status: "VALIDATED",
      },
      include: {
        student: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
        class: { select: { id: true, name: true } },
      },
      orderBy: { student: { lastName: "asc" } },
    });

    // Charger les resultats existants (pathways avec decision)
    // On utilise StudentPathway pour tracer la decision d'examen d'Etat
    const pathways = await this.prisma.studentPathway.findMany({
      where: {
        academicYearId,
        levelId,
      },
    });

    const pathwayByStudent = new Map(pathways.map((p) => [p.studentId, p]));

    return enrollments.map((e) => {
      const pathway = pathwayByStudent.get(e.studentId);
      let result: StateExamResult = "EN_ATTENTE";
      if (pathway?.decision === "ADMIS_DEF" || pathway?.decision === "ADMIS_BAC") {
        result = "ADMIS";
      } else if (pathway?.decision === "REFUSE_DEF" || pathway?.decision === "REFUSE_BAC") {
        result = "REFUSE";
      } else if (pathway?.decision === "ABSENT_EXAM") {
        result = "ABSENT";
      }

      return {
        studentId: e.student.id,
        matricule: e.student.matricule,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        gender: e.student.gender,
        className: e.class.name,
        classId: e.class.id,
        result,
        score: null as number | null,
        observation: pathway?.decision ?? null,
      };
    });
  }

  // ============================================================
  // SAUVEGARDER les resultats pour tout un niveau
  // ============================================================

  async saveResults(dto: SaveStateExamResultsDto, user: CurrentUserPayload) {
    const level = await this.prisma.level.findUnique({
      where: { id: dto.levelId },
    });
    if (!level) throw new NotFoundException("Niveau introuvable");
    assertSchoolAccess(user, level.schoolId, "Niveau introuvable");

    if (level.stateExamType === "NONE") {
      throw new BadRequestException("Ce niveau n'est pas un examen d'Etat");
    }

    const suffix = level.stateExamType; // "DEF" ou "BAC"

    // Verifier que toutes les inscriptions existent
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        levelId: dto.levelId,
        academicYearId: dto.academicYearId,
        status: "VALIDATED",
        studentId: { in: dto.results.map((r) => r.studentId) },
      },
      select: { studentId: true, classId: true },
    });
    const enrolledIds = new Set(enrollments.map((e) => e.studentId));

    const result = await this.prisma.$transaction(async (tx) => {
      let saved = 0;
      let skipped = 0;

      for (const r of dto.results) {
        if (!enrolledIds.has(r.studentId)) {
          skipped++;
          continue;
        }

        const enrollment = enrollments.find((e) => e.studentId === r.studentId);
        if (!enrollment) {
          skipped++;
          continue;
        }

        // Decision a stocker dans StudentPathway
        let decision: string;
        if (r.result === "ADMIS") {
          decision = `ADMIS_${suffix}`;
        } else if (r.result === "REFUSE") {
          decision = `REFUSE_${suffix}`;
        } else if (r.result === "ABSENT") {
          decision = "ABSENT_EXAM";
        } else {
          decision = "EN_ATTENTE";
        }

        // Upsert du pathway (une ligne par eleve par annee)
        const existing = await tx.studentPathway.findFirst({
          where: {
            studentId: r.studentId,
            academicYearId: dto.academicYearId,
          },
        });

        if (existing) {
          await tx.studentPathway.update({
            where: { id: existing.id },
            data: {
              decision,
              result:
                r.result === "ADMIS"
                  ? "PASSED"
                  : r.result === "REFUSE"
                    ? "REPEATED"
                    : "EXCLUDED",
            },
          });
        } else {
          await tx.studentPathway.create({
            data: {
              studentId: r.studentId,
              academicYearId: dto.academicYearId,
              levelId: dto.levelId,
              classId: enrollment.classId,
              decision,
              result:
                r.result === "ADMIS"
                  ? "PASSED"
                  : r.result === "REFUSE"
                    ? "REPEATED"
                    : "EXCLUDED",
            },
          });
        }
        saved++;
      }

      return { saved, skipped, levelCode: level.code, examType: suffix };
    });

    this.logger.log(
      `Resultats ${suffix} sauvegardes : ${result.saved} eleves (${result.skipped} ignores)`,
    );

    return result;
  }
}
