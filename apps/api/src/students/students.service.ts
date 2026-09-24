import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StudentCreateDto, StudentUpdateDto } from "./dto";
import { buildMatricule } from "@sis-mali/shared";
import { generateCSV } from "./utils/csv.util";
import { generateExcel } from "./utils/excel.util";
import { generatePDF } from "./utils/pdf.util";

type EnrollmentStatusFilter = "NOUVEAU" | "ANCIEN" | "REDOUBLANT";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste des eleves avec filtres avances.
   * Calcul automatique du statut d'inscription : NOUVEAU / ANCIEN / REDOUBLANT.
   */
  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    q?: string,
    classId?: string,
    levelId?: string,
    cycle?: string,
    gender?: string,
    ageRange?: string,
    status?: string,
    enrollmentStatus?: EnrollmentStatusFilter,
    onlyNew?: boolean,
    onlyUnpaid?: boolean,
    sortField?: string,
    sortDirection?: "asc" | "desc",
  ) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (gender) where.gender = gender;

    // Recherche insensible aux accents
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { matricule: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    // Filtre par age
    if (ageRange) {
      const today = new Date();
      const ranges: Record<string, [number, number]> = {
        "5-7": [5, 7],
        "8-10": [8, 10],
        "11-13": [11, 13],
        "14-16": [14, 16],
        "17+": [17, 99],
      };
      const [minAge, maxAge] = ranges[ageRange] || [0, 99];
      const maxBirth = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      const minBirth = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
      where.birthDate = { gte: minBirth, lte: maxBirth };
    }

    // Filtre par classe / niveau / cycle (via enrollments)
    if (classId || levelId || cycle) {
      where.enrollments = {
        some: {
          ...(classId ? { classId } : {}),
          ...(levelId ? { levelId } : {}),
          ...(cycle ? { level: { cycle } } : {}),
          status: "VALIDATED",
        },
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Tri
    let orderBy: any = [{ lastName: "asc" }, { firstName: "asc" }];
    if (sortField === "matricule") orderBy = { matricule: sortDirection || "asc" };
    else if (sortField === "firstName") orderBy = { firstName: sortDirection || "asc" };
    else if (sortField === "lastName") orderBy = { lastName: sortDirection || "asc" };
    else if (sortField === "birthDate") orderBy = { birthDate: sortDirection || "asc" };
    else if (sortField === "createdAt") orderBy = { createdAt: sortDirection || "desc" };

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          guardians: {
            include: {
              guardian: {
                select: {
                  id: true, firstName: true, lastName: true, phone: true, relationType: true,
                },
              },
            },
          },
          enrollments: {
            where: { status: "VALIDATED" },
            orderBy: { enrollmentDate: "desc" },
            include: {
              class: { select: { id: true, code: true, name: true } },
              level: { select: { id: true, code: true, name: true, cycle: true } },
              academicYear: { select: { id: true, label: true } },
            },
          },
          _count: {
            select: { invoices: true, payments: true, reportCards: true },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    // Enrichir chaque eleve avec son statut d'inscription
    const enriched = await Promise.all(
      data.map(async (student) => {
        const enrollmentStatus = await this.computeEnrollmentStatus(student.id);
        const unpaidAmount = await this.computeUnpaidAmount(student.id);
        return {
          ...student,
          enrollmentStatus: enrollmentStatus.status,
          yearsEnrolled: enrollmentStatus.yearsEnrolled,
          isRedoublant: enrollmentStatus.isRedoublant,
          previousClass: enrollmentStatus.previousClass,
          unpaidAmount,
        };
      }),
    );

    // Filtrer par nouveaute si demande
    let filtered = enriched;
    if (enrollmentStatus) {
      filtered = enriched.filter((s) => s.enrollmentStatus === enrollmentStatus);
    }
    if (onlyNew) {
      filtered = enriched.filter((s) => s.enrollmentStatus === "NOUVEAU");
    }
    if (onlyUnpaid) {
      filtered = filtered.filter((s) => s.unpaidAmount > 0);
    }

    return {
      data: filtered,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Determine si un eleve est NOUVEAU, ANCIEN ou REDOUBLANT.
   */
  private async computeEnrollmentStatus(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: "VALIDATED" },
      orderBy: { enrollmentDate: "desc" },
      include: {
        class: { select: { code: true, name: true } },
        level: { select: { id: true, code: true, name: true } },
        academicYear: { select: { id: true, label: true, isCurrent: true } },
      },
    });

    if (enrollments.length === 0) {
      return { status: "NOUVEAU" as EnrollmentStatusFilter, yearsEnrolled: 0, isRedoublant: false, previousClass: null };
    }

    const currentEnrollment = enrollments.find((e) => e.academicYear.isCurrent);
    const previousEnrollments = enrollments.filter((e) => !e.academicYear.isCurrent);

    if (!currentEnrollment) {
      return { status: "ANCIEN" as EnrollmentStatusFilter, yearsEnrolled: enrollments.length, isRedoublant: false, previousClass: null };
    }

    // Aucune inscription precedente → NOUVEAU
    if (previousEnrollments.length === 0) {
      return {
        status: "NOUVEAU" as EnrollmentStatusFilter,
        yearsEnrolled: 1,
        isRedoublant: false,
        previousClass: null,
      };
    }

    // Comparer le niveau actuel avec le niveau precedent
    const lastPrevious = previousEnrollments[0];
    const isRedoublant = lastPrevious.levelId === currentEnrollment.levelId;

    return {
      status: isRedoublant ? ("REDOUBLANT" as EnrollmentStatusFilter) : ("ANCIEN" as EnrollmentStatusFilter),
      yearsEnrolled: enrollments.length,
      isRedoublant,
      previousClass: lastPrevious.class?.name || null,
    };
  }

  /**
   * Calcule le solde impaye d'un eleve.
   */
  private async computeUnpaidAmount(studentId: string): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId, status: { not: "CANCELLED" } },
      select: { balance: true },
    });
    return invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
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
            level: { select: { id: true, code: true, name: true, cycle: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        pathways: {
          orderBy: { createdAt: "desc" },
          include: {
            class: { select: { id: true, code: true, name: true } },
            level: { select: { id: true, code: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        invoices: {
          orderBy: { issuedAt: "desc" },
          take: 10,
          select: { id: true, number: true, totalAmount: true, paidAmount: true, balance: true, status: true, issuedAt: true },
        },
        _count: {
          select: { invoices: true, payments: true, reportCards: true },
        },
      },
    });
    if (!student || student.deletedAt) throw new NotFoundException("Eleve introuvable");

    const enrollmentStatus = await this.computeEnrollmentStatus(id);
    const unpaidAmount = await this.computeUnpaidAmount(id);

    return {
      ...student,
      enrollmentStatus: enrollmentStatus.status,
      yearsEnrolled: enrollmentStatus.yearsEnrolled,
      isRedoublant: enrollmentStatus.isRedoublant,
      unpaidAmount,
    };
  }

  async create(dto: StudentCreateDto, createdBy: string) {
    const currentYear = new Date().getFullYear();
    const yearStr = String(currentYear);

    const count = await this.prisma.student.count({
      where: {
        schoolId: dto.schoolId,
        matricule: { startsWith: `SIS-${yearStr}-` },
      },
    });

    const matricule = buildMatricule(currentYear, count + 1);

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
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DROPPED" },
    });
  }

  async getStats(schoolId: string | null) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;

    const allStudents = await this.prisma.student.findMany({
      where,
      select: { id: true, gender: true },
    });

    const total = allStudents.length;
    const boys = allStudents.filter((s) => s.gender === "M").length;
    const girls = total - boys;

    // Calcul Nouveau / Ancien / Redoublant
    let newCount = 0, ancienCount = 0, redoublantCount = 0;
    for (const s of allStudents) {
      const status = await this.computeEnrollmentStatus(s.id);
      if (status.status === "NOUVEAU") newCount++;
      else if (status.status === "REDOUBLANT") redoublantCount++;
      else ancienCount++;
    }

    // Repartition par cycle
    const byCycle = await this.prisma.enrollment.groupBy({
      by: ["levelId"],
      where: {
        student: where,
        status: "VALIDATED",
      },
      _count: true,
    });

    const levelIds = byCycle.map((b) => b.levelId);
    const levels = await this.prisma.level.findMany({
      where: { id: { in: levelIds } },
      select: { id: true, code: true, name: true, cycle: true },
    });

    const cycleCounts: Record<string, number> = {};
    for (const b of byCycle) {
      const level = levels.find((l) => l.id === b.levelId);
      if (!level) continue;
      cycleCounts[level.cycle] = (cycleCounts[level.cycle] || 0) + b._count;
    }

    return {
      total,
      boys,
      girls,
      newCount,
      ancienCount,
      redoublantCount,
      byCycle: Object.entries(cycleCounts).map(([cycle, count]) => ({ cycle, count })),
    };
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

  /**
   * Export CSV des eleves.
   */
  async exportCSV(
    schoolId: string | null,
    classId?: string,
    levelId?: string,
    status?: string,
    enrollmentStatus?: EnrollmentStatusFilter,
  ): Promise<string> {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    if (classId || levelId) {
      where.enrollments = {
        some: {
          ...(classId ? { classId } : {}),
          ...(levelId ? { levelId } : {}),
          status: "VALIDATED",
        },
      };
    }

    const students = await this.prisma.student.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        guardians: {
          include: {
            guardian: {
              select: {
                firstName: true, lastName: true, phone: true, relationType: true,
              },
            },
          },
        },
        enrollments: {
          where: { status: "VALIDATED" },
          orderBy: { enrollmentDate: "desc" },
          take: 1,
          include: {
            class: { select: { name: true } },
            level: { select: { name: true, cycle: true } },
          },
        },
      },
    });

    // Filtrer par statut d'inscription
    let filtered = students;
    if (enrollmentStatus) {
      const enriched = await Promise.all(
        students.map(async (s) => {
          const stat = await this.computeEnrollmentStatus(s.id);
          return { student: s, enrollmentStatus: stat.status };
        }),
      );
      filtered = enriched
        .filter((e) => e.enrollmentStatus === enrollmentStatus)
        .map((e) => e.student);
    }

    // Construire les lignes CSV
    const headers = [
      "Matricule",
      "Nom",
      "Prenom",
      "Sexe",
      "Date de naissance",
      "Lieu de naissance",
      "Nationalite",
      "Telephone",
      "Classe",
      "Niveau",
      "Cycle",
      "Statut",
      "Tuteur principal",
      "Telephone tuteur",
    ];

    const rows = filtered.map((s) => {
      const primaryGuardian = s.guardians.find((g) => g.isPrimary) || s.guardians[0];
      const enrollment = s.enrollments[0];
      return [
        s.matricule,
        s.lastName,
        s.firstName,
        s.gender === "M" ? "Masculin" : "Feminin",
        s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "",
        s.birthPlace || "",
        s.nationality || "",
        s.phone || "",
        enrollment?.class?.name || "",
        enrollment?.level?.name || "",
        enrollment?.level?.cycle || "",
        s.status,
        primaryGuardian ? `${primaryGuardian.guardian.lastName} ${primaryGuardian.guardian.firstName}` : "",
        primaryGuardian?.guardian.phone || "",
      ];
    });

    return generateCSV(headers, rows);
  }


  /**
   * Export Excel des eleves.
   */
  async exportExcel(
    schoolId: string | null,
    schoolName: string,
    classId?: string,
    levelId?: string,
    status?: string,
    enrollmentStatus?: EnrollmentStatusFilter,
  ): Promise<Buffer> {
    const students = await this.getStudentsForExport(schoolId, classId, levelId, status, enrollmentStatus);

    const columns = [
      { header: "Matricule", key: "matricule", width: 18 },
      { header: "Nom", key: "lastName", width: 15 },
      { header: "Prenom", key: "firstName", width: 15 },
      { header: "Sexe", key: "gender", width: 10 },
      { header: "Date naissance", key: "birthDate", width: 15 },
      { header: "Lieu naissance", key: "birthPlace", width: 15 },
      { header: "Nationalite", key: "nationality", width: 12 },
      { header: "Telephone", key: "phone", width: 18 },
      { header: "Classe", key: "className", width: 12 },
      { header: "Niveau", key: "levelName", width: 18 },
      { header: "Statut", key: "status", width: 12 },
      { header: "Tuteur", key: "guardianName", width: 22 },
      { header: "Tel. tuteur", key: "guardianPhone", width: 18 },
    ];

    const data = students.map((s) => {
      const primaryGuardian = s.guardians.find((g) => g.isPrimary) || s.guardians[0];
      const enrollment = s.enrollments[0];
      return {
        matricule: s.matricule,
        lastName: s.lastName,
        firstName: s.firstName,
        gender: s.gender === "M" ? "Masculin" : "Feminin",
        birthDate: s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "",
        birthPlace: s.birthPlace || "",
        nationality: s.nationality || "",
        phone: s.phone || "",
        className: enrollment?.class?.name || "",
        levelName: enrollment?.level?.name || "",
        status: s.status,
        guardianName: primaryGuardian
          ? `${primaryGuardian.guardian.lastName} ${primaryGuardian.guardian.firstName}`
          : "",
        guardianPhone: primaryGuardian?.guardian.phone || "",
      };
    });

    return generateExcel({
      title: "Liste des eleves",
      subtitle: `${data.length} eleve(s) — Annee scolaire ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      sheetName: "Eleves",
      schoolName,
      columns,
      data,
    });
  }

  /**
   * Export PDF des eleves.
   */
  async exportPDF(
    schoolId: string | null,
    schoolName: string,
    schoolAddress: string | undefined,
    classId?: string,
    levelId?: string,
    status?: string,
    enrollmentStatus?: EnrollmentStatusFilter,
  ): Promise<Buffer> {
    const students = await this.getStudentsForExport(schoolId, classId, levelId, status, enrollmentStatus);

    const columns = [
      { header: "Matricule", key: "matricule", width: "14%" },
      { header: "Nom et prenom", key: "fullName", width: "22%" },
      { header: "Sexe", key: "gender", width: "8%" },
      { header: "Naissance", key: "birthDate", width: "12%" },
      { header: "Classe", key: "className", width: "10%" },
      { header: "Tuteur", key: "guardianName", width: "20%" },
      { header: "Telephone", key: "guardianPhone", width: "14%" },
    ];

    const data = students.map((s) => {
      const primaryGuardian = s.guardians.find((g) => g.isPrimary) || s.guardians[0];
      const enrollment = s.enrollments[0];
      return {
        matricule: s.matricule,
        fullName: `${s.lastName} ${s.firstName}`,
        gender: s.gender === "M" ? "M" : "F",
        birthDate: s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "",
        className: enrollment?.class?.name || "",
        guardianName: primaryGuardian
          ? `${primaryGuardian.guardian.lastName} ${primaryGuardian.guardian.firstName}`
          : "",
        guardianPhone: primaryGuardian?.guardian.phone || "",
      };
    });

    return generatePDF({
      title: "LISTE DES ELEVES",
      subtitle: `${data.length} eleve(s) — Genere le ${new Date().toLocaleDateString("fr-FR")}`,
      schoolName,
      schoolAddress,
      columns,
      data,
      footerNote: "Document genere automatiquement par SIS-MALI — Signature et cachet du directeur",
    });
  }

  /**
   * Helper : recupere les eleves pour export avec filtres.
   */
  private async getStudentsForExport(
    schoolId: string | null,
    classId?: string,
    levelId?: string,
    status?: string,
    enrollmentStatus?: EnrollmentStatusFilter,
  ) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    if (classId || levelId) {
      where.enrollments = {
        some: {
          ...(classId ? { classId } : {}),
          ...(levelId ? { levelId } : {}),
          status: "VALIDATED",
        },
      };
    }

    const students = await this.prisma.student.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        guardians: {
          include: {
            guardian: {
              select: {
                firstName: true, lastName: true, phone: true, relationType: true,
              },
            },
          },
        },
        enrollments: {
          where: { status: "VALIDATED" },
          orderBy: { enrollmentDate: "desc" },
          take: 1,
          include: {
            class: { select: { name: true } },
            level: { select: { name: true, cycle: true } },
          },
        },
      },
    });

    if (!enrollmentStatus) return students;

    const enriched = await Promise.all(
      students.map(async (s) => {
        const stat = await this.computeEnrollmentStatus(s.id);
        return { student: s, enrollmentStatus: stat.status };
      }),
    );
    return enriched
      .filter((e) => e.enrollmentStatus === enrollmentStatus)
      .map((e) => e.student);
  }


  /**
   * Recupere les freres/soeurs d'un eleve (eleves partageant au moins un tuteur).
   */
  async getSiblings(studentId: string) {
    // 1. Recuperer les tuteurs de l'eleve
    const studentGuardians = await this.prisma.studentGuardian.findMany({
      where: { studentId },
      select: { guardianId: true },
    });

    if (studentGuardians.length === 0) return [];

    const guardianIds = studentGuardians.map((sg) => sg.guardianId);

    // 2. Trouver les autres eleves lies a ces tuteurs
    const siblings = await this.prisma.studentGuardian.findMany({
      where: {
        guardianId: { in: guardianIds },
        studentId: { not: studentId },
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: "VALIDATED" },
              orderBy: { enrollmentDate: "desc" },
              take: 1,
              include: {
                class: { select: { id: true, code: true, name: true } },
                level: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    // 3. Dedupliquer (un eleve peut partager 2 tuteurs)
    const uniqueMap = new Map();
    for (const rel of siblings) {
      if (!uniqueMap.has(rel.student.id)) {
        uniqueMap.set(rel.student.id, {
          id: rel.student.id,
          matricule: rel.student.matricule,
          firstName: rel.student.firstName,
          lastName: rel.student.lastName,
          gender: rel.student.gender,
          birthDate: rel.student.birthDate,
          status: rel.student.status,
          enrollments: rel.student.enrollments,
        });
      }
    }

    return Array.from(uniqueMap.values());
  }

}
