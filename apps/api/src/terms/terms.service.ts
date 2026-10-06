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
