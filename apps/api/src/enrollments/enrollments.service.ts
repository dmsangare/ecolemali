import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentCreateDto, EnrollmentUpdateDto } from "./dto";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    q?: string,
    academicYearId?: string,
    classId?: string,
    status?: string,
  ) {
    const where: any = {};
    if (schoolId) where.student = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    if (q) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { matricule: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrollmentDate: "desc" },
        include: {
          student: {
            select: {
              id: true, matricule: true, firstName: true, lastName: true, gender: true, birthDate: true,
            },
          },
          class: { select: { id: true, code: true, name: true } },
          level: { select: { id: true, code: true, name: true } },
          academicYear: { select: { id: true, label: true } },
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
        level: true,
        academicYear: true,
      },
    });
    if (!enrollment) throw new NotFoundException("Inscription introuvable");
    return enrollment;
  }

  async create(dto: EnrollmentCreateDto) {
    // Verifier que l'eleve n'est pas deja inscrit cette annee
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: dto.studentId,
          academicYearId: dto.academicYearId,
        },
      },
    });
    if (existing) {
      throw new ConflictException("Cet eleve est deja inscrit pour cette annee scolaire");
    }

    // Verifier que la classe appartient bien a l'annee scolaire
    const cls = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException("Classe introuvable");
    if (cls.academicYearId !== dto.academicYearId) {
      throw new BadRequestException("La classe ne correspond pas a l annee scolaire");
    }

    return this.prisma.enrollment.create({
      data: {
        ...dto,
        enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : new Date(),
        status: (dto.status || "PENDING") as any,
      } as any,
      include: {
        student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        class: { select: { id: true, code: true, name: true } },
        level: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async update(id: string, dto: EnrollmentUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.enrollmentDate) data.enrollmentDate = new Date(dto.enrollmentDate);
    if (dto.status) data.status = dto.status as any;
    return this.prisma.enrollment.update({ where: { id }, data });
  }

  async validate(id: string) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === "VALIDATED") {
      throw new BadRequestException("Cette inscription est deja validee");
    }
    if (enrollment.status === "CANCELLED") {
      throw new BadRequestException("Impossible de valider une inscription annulee");
    }

    // Mettre a jour le statut
    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: { status: "VALIDATED" },
    });

    // Creer une entree dans student_pathways
    await this.prisma.studentPathway.upsert({
      where: { id: `${enrollment.studentId}-${enrollment.academicYearId}` },
      update: {
        levelId: enrollment.levelId,
        classId: enrollment.classId,
      },
      create: {
        id: `${enrollment.studentId}-${enrollment.academicYearId}`,
        studentId: enrollment.studentId,
        academicYearId: enrollment.academicYearId,
        levelId: enrollment.levelId,
        classId: enrollment.classId,
      },
    }).catch(async () => {
      // Fallback si l'upsert échoue (id composite)
      const existing = await this.prisma.studentPathway.findFirst({
        where: { studentId: enrollment.studentId, academicYearId: enrollment.academicYearId },
      });
      if (!existing) {
        await this.prisma.studentPathway.create({
          data: {
            studentId: enrollment.studentId,
            academicYearId: enrollment.academicYearId,
            levelId: enrollment.levelId,
            classId: enrollment.classId,
          },
        });
      }
    });

    return updated;
  }

  async cancel(id: string) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === "VALIDATED") {
      throw new BadRequestException("Impossible d annuler une inscription validee. Contactez la direction.");
    }
    return this.prisma.enrollment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async complete(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  async remove(id: string) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === "VALIDATED") {
      throw new BadRequestException("Impossible de supprimer une inscription validee");
    }
    return this.prisma.enrollment.delete({ where: { id } });
  }
}
