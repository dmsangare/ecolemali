import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TermCreateDto, TermUpdateDto } from "./dto";

@Injectable()
export class TermsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(academicYearId?: string) {
    const where = academicYearId ? { academicYearId } : {};
    return this.prisma.term.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });
  }

  async findCurrent() {
    const now = new Date();

    const currentYear = await this.prisma.academicYear.findFirst({
      where: { isCurrent: true },
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

  async findOne(id: string) {
    const term = await this.prisma.term.findUnique({ where: { id } });
    if (!term) throw new NotFoundException("Trimestre introuvable");
    return term;
  }

  async create(dto: TermCreateDto) {
    return this.prisma.term.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      } as any,
    });
  }

  async update(id: string, dto: TermUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.term.update({ where: { id }, data });
  }

  async lock(id: string) {
    await this.findOne(id);
    return this.prisma.term.update({ where: { id }, data: { isLocked: true } });
  }

  async unlock(id: string) {
    await this.findOne(id);
    return this.prisma.term.update({ where: { id }, data: { isLocked: false } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.term.delete({ where: { id } });
  }
}
