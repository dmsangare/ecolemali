import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20) {
    const where = schoolId ? { schoolId } : {};
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
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");
    return user;
  }
}
