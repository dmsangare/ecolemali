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

  async bulkEntry(dto: GradesBulkDto, enteredBy: string) {
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
            isAbsent: g.isAbsent,
            observation: g.observation,
            enteredBy,
          },
          create: {
            assessmentId: dto.assessmentId,
            studentId: g.studentId,
            value: g.value,
            isAbsent: g.isAbsent,
            observation: g.observation,
            enteredBy,
          },
        }),
      ),
    );

    return { updated: results.length, grades: results };
  }

  async update(id: string, dto: GradeUpdateDto, updatedBy: string) {
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

    return this.prisma.grade.update({
      where: { id },
      data: { ...dto, enteredBy: updatedBy },
    });
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

  async remove(id: string) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException("Note introuvable");
    if (grade.locked) throw new BadRequestException("Note verrouillee");
    return this.prisma.grade.delete({ where: { id } });
  }
}
