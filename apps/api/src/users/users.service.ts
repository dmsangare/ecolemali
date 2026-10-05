import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, q?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          status: true, lastLoginAt: true, createdAt: true,
          userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        status: true, schoolId: true, lastLoginAt: true, createdAt: true,
        mustChangePassword: true,
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
        teacher: { select: { id: true, matricule: true, firstName: true, lastName: true } },
      },
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");
    return user;
  }

  async create(dto: {
    schoolId?: string;
    email?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
    roleIds: string[];
    teacherId?: string;
  }) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException("Cet email est deja utilise");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const createdUser = await this.prisma.user.create({
      data: {
        schoolId: dto.schoolId,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: "ACTIVE",
        mustChangePassword: true,
        userRoles: {
          create: dto.roleIds.map((roleId) => ({
            roleId,
            schoolId: dto.schoolId,
          })),
        },
      },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        status: true, createdAt: true,
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    });

    // Si teacherId fourni, lier la fiche Teacher a ce user
    if (dto.teacherId) {
      await this.prisma.teacher.update({
        where: { id: dto.teacherId },
        data: { userId: createdUser.id },
      });
    }

    return createdUser;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);

    const data: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: dto.status,
    };

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) throw new ConflictException("Cet email est deja utilise");
      data.email = dto.email;
    }

    // Si roleIds fourni, on remplace tous les roles
    if (dto.roleIds && Array.isArray(dto.roleIds)) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId: string) => ({
          userId: id,
          roleId,
          schoolId: dto.schoolId,
        })),
      });
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        status: true,
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (user?.userRoles.some((ur) => ur.role.code === "SUPER_ADMIN")) {
      const superAdmins = await this.prisma.user.count({
        where: { userRoles: { some: { role: { code: "SUPER_ADMIN" } } } },
      });
      if (superAdmins <= 1) {
        throw new BadRequestException("Impossible de supprimer le dernier SUPER_ADMIN");
      }
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async resetPassword(id: string, newPassword: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
      select: { id: true, email: true },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, description: true },
    });
  }
}
