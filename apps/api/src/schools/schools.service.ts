import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SchoolCreateDto, SchoolUpdateDto } from "./dto";

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, q?: string) {
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.school.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        setting: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
            academicYears: true,
          },
        },
      },
    });
    if (!school) throw new NotFoundException("Etablissement introuvable");
    return school;
  }

  async create(dto: SchoolCreateDto) {
    return this.prisma.school.create({ data: dto as any });
  }

  async update(id: string, dto: SchoolUpdateDto) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.school.delete({ where: { id } });
  }
}
