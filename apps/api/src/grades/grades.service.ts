import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GradesBulkDto, GradeUpdateDto } from "./dto";
import { calculateWeightedAverage } from "@sis-mali/shared";

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException("Evaluation introuvable");

    // Recuperer tous les eleves inscrits dans la classe
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId: assessment.classId,
        academicYearId: assessment.academicYearId,
        status: "VALIDATED",
      },
      include: {
        student: {
          select: {
            id: true, matricule: true, firstName: true, lastName: true, gender: true,
          },
        },
      },
      orderBy: { student: { lastName: "asc" } },
    });

    const grades = await this.prisma.grade.findMany({
      where: { assessmentId },
    });

    const gradesByStudent = new Map(grades.map((g) => [g.studentId, g]));

    return {
      assessment,
      grades: enrollments.map((e) => {
        const grade = gradesByStudent.get(e.studentId);
        return {
          studentId: e.studentId,
          student: e.student,
          grade: grade
            ? {
                id: grade.id,
                value: grade.value,
                isAbsent: grade.isAbsent,
                observation: grade.observation,
                locked: grade.locked,
              }
            : null,
        };
      }),
    };
  }

  async bulkEntry(dto: GradesBulkDto, user: { id: string; roles: string[] }) {
    await this.assertCanGrade(dto.assessmentId, user);
    const enteredBy = user.id;
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: dto.assessmentId },
    });
    if (!assessment) throw new NotFoundException("Evaluation introuvable");

    if (assessment.status === "LOCKED" || assessment.status === "VALIDATED") {
      throw new BadRequestException("Cette evaluation est verrouillee ou validee");
    }

    // Verifier les plages
    for (const g of dto.grades) {
      if (g.value !== null && (g.value < 0 || g.value > Number(assessment.maxScore))) {
        throw new BadRequestException(
          `Note hors plage pour l eleve ${g.studentId}: ${g.value} (max ${assessment.maxScore})`,
        );
      }
    }

    // Upsert toutes les notes
    const results = await this.prisma.$transaction(
      dto.grades.map((g) =>
        this.prisma.grade.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId: dto.assessmentId,
              studentId: g.studentId,
            },
          },
          update: {
            value: g.value,
            status: g.status ?? "PRESENT",
            isAbsent: g.isAbsent ?? false,
            isExempt: g.isExempt ?? false,
            observation: g.observation,
            comment: g.comment,
            enteredBy,
          },
          create: {
            assessmentId: dto.assessmentId,
            studentId: g.studentId,
            value: g.value,
            status: g.status ?? "PRESENT",
            isAbsent: g.isAbsent ?? false,
            isExempt: g.isExempt ?? false,
            observation: g.observation,
            comment: g.comment,
            enteredBy,
          },
        }),
      ),
    );

    return { updated: results.length, grades: results };
  }

  async update(id: string, dto: GradeUpdateDto, user: { id: string; roles: string[] }) {
    // Verifier le droit sur l'evaluation de cette note
    const gradeRef = await this.prisma.grade.findUnique({
      where: { id },
      select: { assessmentId: true },
    });
    if (!gradeRef) throw new NotFoundException("Note introuvable");
    await this.assertCanGrade(gradeRef.assessmentId, user);
    const updatedBy = user.id;
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { assessment: true },
    });
    if (!grade) throw new NotFoundException("Note introuvable");

    if (grade.locked) {
      throw new BadRequestException("Cette note est verrouillee et ne peut plus etre modifiee");
    }

    if (dto.value !== undefined && dto.value !== null) {
      if (dto.value < 0 || dto.value > Number(grade.assessment.maxScore)) {
        throw new BadRequestException(`Note hors plage (max ${grade.assessment.maxScore})`);
      }
    }

    const oldValue = grade.value;
    const updated = await this.prisma.grade.update({
      where: { id },
      data: { ...dto, enteredBy: updatedBy },
    });

    // Journal GradeAudit si value a changé
    const valueChanged =
      dto.value !== undefined &&
      (oldValue === null || updated.value === null
        ? oldValue !== updated.value
        : Number(oldValue) !== Number(updated.value));
    if (valueChanged) {
      await this.prisma.gradeAudit.create({
        data: {
          gradeId: id,
          oldValue: oldValue,
          newValue: updated.value,
          userId: user.id,
          motive: "Modification manuelle",
        },
      });
    }

    return updated;
  }

  /**
   * Calcule la moyenne d'un eleve pour une matiere et un trimestre.
   */
  async getStudentSubjectAverage(studentId: string, subjectId: string, termId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        subjectId,
        termId,
        grades: { some: { studentId } },
      },
      include: {
        grades: { where: { studentId } },
      },
    });

    const gradesWithCoeff = assessments
      .filter((a) => a.grades.length > 0 && a.grades[0].value !== null)
      .map((a) => ({
        value: Number(a.grades[0].value),
        coefficient: Number(a.coefficient),
      }));

    const average = calculateWeightedAverage(gradesWithCoeff);
    return {
      studentId,
      subjectId,
      termId,
      assessmentsCount: gradesWithCoeff.length,
      average,
    };
  }

  /**
   * Statistiques d'une evaluation (meilleure note, plus faible, moyenne classe)
   */
  async getAssessmentStats(assessmentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { assessmentId, value: { not: null } },
    });

    if (grades.length === 0) {
      return { count: 0, average: null, min: null, max: null };
    }

    const values = grades.map((g) => Number(g.value));
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      average: Math.round((sum / values.length) * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  async remove(id: string, user: { id: string; roles: string[] }) {
    const gradeRef = await this.prisma.grade.findUnique({
      where: { id },
      select: { assessmentId: true },
    });
    if (!gradeRef) throw new NotFoundException("Note introuvable");
    await this.assertCanGrade(gradeRef.assessmentId, user);
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException("Note introuvable");
    if (grade.locked) throw new BadRequestException("Note verrouillee");
    return this.prisma.grade.delete({ where: { id } });
  }

  /**
   * Verifie que l'utilisateur a le droit de noter cette evaluation.
   * - SUPER_ADMIN, DIRECTOR, SECRETARY : toujours autorises
   * - TEACHER : doit avoir une assignation (TeacherAssignment) sur la classe/matiere
   * - Autres : refuses
   */
  private async assertCanGrade(assessmentId: string, user: { id: string; roles: string[] }) {
    // Verifier que l'evaluation n'est pas deja validee ou verrouillee
    const assessmentStatus = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { status: true },
    });
    if (!assessmentStatus) throw new NotFoundException("Evaluation introuvable");
    if (assessmentStatus.status === "VALIDATED" || assessmentStatus.status === "LOCKED") {
      throw new BadRequestException(
        "Cette evaluation est validee/verrouillee. Les notes ne peuvent plus etre modifiees.",
      );
    }

    // Les roles privilegies passent toujours
    const privileged = ["SUPER_ADMIN", "DIRECTOR", "SECRETARY"];
    if (user.roles.some((r) => privileged.includes(r))) return;

    // Pour les enseignants : verifier l'assignation
    if (!user.roles.includes("TEACHER")) {
      throw new BadRequestException("Vous n'avez pas le droit de noter");
    }

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { classId: true, subjectId: true, academicYearId: true },
    });
    if (!assessment) throw new NotFoundException("Evaluation introuvable");

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!teacher) {
      throw new BadRequestException("Aucun profil enseignant associe a votre compte");
    }

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId: assessment.classId,
        subjectId: assessment.subjectId,
        academicYearId: assessment.academicYearId,
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        "Vous n'etes pas assigne a cette classe/matiere pour cette annee",
      );
    }
  }
}
