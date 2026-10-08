import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TermCreateDto, TermUpdateDto } from "./dto";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess, isSuperAdmin, schoolWhere } from "../common/utils";

@Injectable()
export class TermsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload, academicYearId?: string) {
    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (!isSuperAdmin(user)) where.academicYear = schoolWhere(user);

    return this.prisma.term.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });
  }

  async findCurrent(user: CurrentUserPayload) {
    const now = new Date();

    const currentYear = await this.prisma.academicYear.findFirst({
      where: { isCurrent: true, ...schoolWhere(user) },
      orderBy: { startDate: "desc" },
    });

    if (!currentYear) {
      return null;
    }

    const activeTerm = await this.prisma.term.findFirst({
      where: {
        academicYearId: currentYear.id,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { orderIndex: "asc" },
    });

    if (activeTerm) return activeTerm;

    return this.prisma.term.findFirst({
      where: { academicYearId: currentYear.id },
      orderBy: { orderIndex: "asc" },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const term = await this.prisma.term.findUnique({ where: { id } });
    if (!term) throw new NotFoundException("Trimestre introuvable");
    const year = await this.prisma.academicYear.findUnique({
      where: { id: term.academicYearId },
      select: { schoolId: true },
    });
    assertSchoolAccess(user, year?.schoolId, "Trimestre introuvable");
    return term;
  }

  async create(dto: TermCreateDto, user: CurrentUserPayload) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
      select: { schoolId: true },
    });
    assertSchoolAccess(user, year?.schoolId, "Annee scolaire introuvable");
    return this.prisma.term.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      } as any,
    });
  }

  async update(id: string, dto: TermUpdateDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.term.update({ where: { id }, data });
  }

  /**
   * Genere les periodes mensuelles (compositions du 1er cycle) pour une annee scolaire.
   * Cree un mois pour chaque mois de l'annee scolaire (octobre a juin par defaut).
   * Skip les mois deja existants.
   */
  async generateMonthly(academicYearId: string, user: CurrentUserPayload) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, schoolId: true, startDate: true, endDate: true },
    });
    assertSchoolAccess(user, year?.schoolId, "Annee scolaire introuvable");
    if (!year) throw new NotFoundException("Annee scolaire introuvable");

    // Lister les mois de l'annee scolaire (du 1er jour du 1er mois au dernier jour du dernier mois)
    const start = new Date(year.startDate);
    const end = new Date(year.endDate);

    // Verifier les mois deja existants
    const existing = await this.prisma.term.findMany({
      where: { academicYearId, type: "MOIS" as any },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name));

    // Generer les mois (du mois de startDate au mois de endDate)
    const months: Array<{ name: string; startDate: Date; endDate: Date; orderIndex: number }> = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    let orderIndex = 100; // On met les mois a partir de 100 pour ne pas confondre avec les trimestres

    const MONTH_NAMES = [
      "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
    ];

    while (current.getTime() <= end.getTime()) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const name = `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`;

      if (!existingNames.has(name)) {
        months.push({
          name,
          startDate: monthStart,
          endDate: monthEnd,
          orderIndex: orderIndex++,
        });
      }

      current.setMonth(current.getMonth() + 1);
    }

    if (months.length === 0) {
      return { created: 0, message: "Tous les mois existent deja" };
    }

    await this.prisma.term.createMany({
      data: months.map((m) => ({
        academicYearId,
        name: m.name,
        type: "MOIS" as any,
        startDate: m.startDate,
        endDate: m.endDate,
        orderIndex: m.orderIndex,
      })) as any,
    });

    return {
      created: months.length,
      months: months.map((m) => m.name),
    };
  }

  async lock(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.term.update({ where: { id }, data: { isLocked: true } });
  }

  async unlock(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.term.update({ where: { id }, data: { isLocked: false } });
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.term.delete({ where: { id } });
  }
}
