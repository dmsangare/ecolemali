import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string, query: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: any = { schoolId };
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { matricule: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          assignments: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        assignments: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Enseignant introuvable');
    return teacher;
  }

  async create(schoolId: string, dto: any) {
    if (!dto.firstName || !dto.lastName) {
      throw new BadRequestException('Nom et prénom obligatoires');
    }

    // Générer un matricule auto si non fourni
    let matricule = dto.matricule;
    if (!matricule) {
      const count = await this.prisma.teacher.count({ where: { schoolId } });
      matricule = `ENS-${String(count + 1).padStart(4, '0')}`;
    }

    return this.prisma.teacher.create({
      data: {
        schoolId,
        matricule,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        address: dto.address ?? null,
        specialty: dto.specialty ?? null,
        diploma: dto.diploma ?? null,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
        contractType: dto.contractType ?? null,
        status: dto.status ?? 'ACTIVE',
      },
    });
  }

  async update(schoolId: string, id: string, dto: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Enseignant introuvable');

    return this.prisma.teacher.update({
      where: { id },
      data: {
        firstName: dto.firstName ?? teacher.firstName,
        lastName: dto.lastName ?? teacher.lastName,
        gender: dto.gender ?? teacher.gender,
        phone: dto.phone ?? teacher.phone,
        email: dto.email ?? teacher.email,
        address: dto.address ?? teacher.address,
        specialty: dto.specialty ?? teacher.specialty,
        diploma: dto.diploma ?? teacher.diploma,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : teacher.hireDate,
        contractType: dto.contractType ?? teacher.contractType,
        status: dto.status ?? teacher.status,
      },
    });
  }

  async remove(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Enseignant introuvable');

    const assignments = await this.prisma.teacherAssignment.count({ where: { teacherId: id } });
    if (assignments > 0) {
      throw new BadRequestException(
        `Impossible : ${assignments} assignation(s) à retirer d'abord`,
      );
    }

    await this.prisma.teacher.delete({ where: { id } });
    return { success: true };
  }

  async assignSubject(schoolId: string, teacherId: string, dto: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
    if (!teacher) throw new NotFoundException('Enseignant introuvable');

    if (!dto.subjectId || !dto.classId || !dto.academicYearId) {
      throw new BadRequestException('subjectId, classId et academicYearId obligatoires');
    }

    const existing = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        subjectId: dto.subjectId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
      },
    });
    if (existing) throw new BadRequestException('Assignation déjà existante');

    return this.prisma.teacherAssignment.create({
      data: {
        teacherId,
        subjectId: dto.subjectId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        isMain: dto.isMain ?? false,
      },
    });
  }

  async removeAssignment(schoolId: string, teacherId: string, assignmentId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
    if (!teacher) throw new NotFoundException('Enseignant introuvable');

    await this.prisma.teacherAssignment.delete({ where: { id: assignmentId } });
    return { success: true };
  }

  async getSubjects(schoolId: string) {
    const data = await this.prisma.subject.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
    return { data };
  }

  async getClasses(schoolId: string) {
    const data = await this.prisma.class.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return { data };
  }

  async getAcademicYears(schoolId: string) {
    const data = await this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
      select: { id: true, label: true, isCurrent: true },
    });
    return { data };
  }
}
