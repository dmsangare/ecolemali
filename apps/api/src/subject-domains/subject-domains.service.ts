import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubjectDomainCreateDto, SubjectDomainUpdateDto } from "./dto";
import { CurrentUserPayload } from "../common/decorators";

@Injectable()
export class SubjectDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload) {
    const where: any = {};
    if (user.schoolId) where.schoolId = user.schoolId;
    return this.prisma.subjectDomain.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { subjects: true } } },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const domain = await this.prisma.subjectDomain.findUnique({
      where: { id },
      include: { subjects: { select: { id: true, name: true, code: true } } },
    });
    if (!domain) throw new NotFoundException("Domaine introuvable");
    if (user.schoolId && domain.schoolId !== user.schoolId) {
      throw new ForbiddenException("Accès interdit");
    }
    return domain;
  }

  async create(dto: SubjectDomainCreateDto, user: CurrentUserPayload) {
    const schoolId = dto.schoolId || (user.schoolId ?? undefined);
    if (user.schoolId && schoolId !== user.schoolId) {
      throw new ForbiddenException("Accès interdit");
    }
    if (!schoolId) {
      throw new ForbiddenException("schoolId requis");
    }
    return this.prisma.subjectDomain.create({
      data: { ...dto, schoolId },
    });
  }

  async update(id: string, dto: SubjectDomainUpdateDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.subjectDomain.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.subjectDomain.delete({ where: { id } });
  }
}
