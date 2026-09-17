import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StudentCreateDto, StudentUpdateDto } from "./dto";
import { buildMatricule } from "@sis-mali/shared";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    q?: string,
    classId?: string,
    levelId?: string,
    status?: string,
  ) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { matricule: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    if (classId || levelId) {
      where.enrollments = {
        some: {
          ...(classId ? { classId } : {}),
          ...(levelId ? { levelId } : {}),
          status: "VALIDATED",
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthPlace: true,
          nationality: true,
          phone: true,
          photoUrl: true,
          status: true,
          createdAt: true,
          enrollments: {
            where: { status: "VALIDATED" },
            take: 1,
            orderBy: { enrollmentDate: "desc" },
            select: {
              class: { select: { id: true, code: true, name: true } },
              level: { select: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        guardians: {
          include: { guardian: true },
        },
        documents: { orderBy: { uploadedAt: "desc" } },
        enrollments: {
          orderBy: { enrollmentDate: "desc" },
          include: {
            class: { select: { id: true, code: true, name: true } },
            level: { select: { id: true, code: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        pathways: {
          orderBy: { createdAt: "desc" },
          include: {
            class: { select: { id: true, code: true } },
            level: { select: { id: true, code: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        _count: {
          select: { invoices: true, payments: true, reportCards: true },
        },
      },
    });
    if (!student || student.deletedAt) throw new NotFoundException("Eleve introuvable");
    return student;
  }

  async create(dto: StudentCreateDto, createdBy: string) {
    // Générer le matricule automatiquement
    const currentYear = new Date().getFullYear();
    const yearStr = String(currentYear);

    // Compter les élèves de cette année
    const count = await this.prisma.student.count({
      where: {
        schoolId: dto.schoolId,
        matricule: { startsWith: `SIS-${yearStr}-` },
      },
    });

    const matricule = buildMatricule(currentYear, count + 1);

    // Vérifier unicité (sécurité)
    const existing = await this.prisma.student.findUnique({
      where: { schoolId_matricule: { schoolId: dto.schoolId, matricule } },
    });
    if (existing) {
      throw new ConflictException("Conflit de matricule, veuillez reessayer");
    }

    return this.prisma.student.create({
      data: {
        ...dto,
        matricule,
        birthDate: new Date(dto.birthDate),
        status: (dto.status || "ACTIVE") as any,
        gender: dto.gender as any,
      } as any,
    });
  }

  async update(id: string, dto: StudentUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    return this.prisma.student.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DROPPED" },
    });
  }

  async getPathway(id: string) {
    await this.findOne(id);
    return this.prisma.studentPathway.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      include: {
        academicYear: { select: { id: true, label: true } },
        level: { select: { id: true, code: true, name: true } },
        class: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async getDocuments(id: string) {
    await this.findOne(id);
    return this.prisma.studentDocument.findMany({
      where: { studentId: id },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async addDocument(
    studentId: string,
    documentData: {
      type: string;
      fileUrl: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
    },
    uploadedBy: string,
  ) {
    await this.findOne(studentId);
    return this.prisma.studentDocument.create({
      data: {
        studentId,
        type: documentData.type as any,
        fileUrl: documentData.fileUrl,
        fileName: documentData.fileName,
        mimeType: documentData.mimeType,
        sizeBytes: documentData.sizeBytes,
        uploadedBy,
      },
    });
  }

  async removeDocument(studentId: string, documentId: string) {
    await this.findOne(studentId);
    return this.prisma.studentDocument.delete({ where: { id: documentId } });
  }

  async statsBySchool(schoolId: string) {
    const [total, boys, girls, byLevel, byClass] = await Promise.all([
      this.prisma.student.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.student.count({ where: { schoolId, gender: "M", deletedAt: null } }),
      this.prisma.student.count({ where: { schoolId, gender: "F", deletedAt: null } }),
      this.prisma.enrollment.groupBy({
        by: ["levelId"],
        where: { student: { schoolId, deletedAt: null }, status: "VALIDATED" },
        _count: true,
      }),
      this.prisma.enrollment.groupBy({
        by: ["classId"],
        where: { student: { schoolId, deletedAt: null }, status: "VALIDATED" },
        _count: true,
      }),
    ]);

    // Enrichir avec les noms de niveaux et classes
    const levelIds = byLevel.map((b) => b.levelId);
    const classIds = byClass.map((b) => b.classId);

    const [levels, classes] = await Promise.all([
      this.prisma.level.findMany({
        where: { id: { in: levelIds } },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      total,
      boys,
      girls,
      byLevel: byLevel.map((b) => ({
        level: levels.find((l) => l.id === b.levelId),
        count: b._count,
      })),
      byClass: byClass.map((b) => ({
        class: classes.find((c) => c.id === b.classId),
        count: b._count,
      })),
    };
  }
}
