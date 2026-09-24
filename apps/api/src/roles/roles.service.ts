import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste tous les roles avec le nombre de permissions et d'utilisateurs.
   */
  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            rolePermissions: true,
            userRoles: true,
          },
        },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      permissionsCount: r._count.rolePermissions,
      usersCount: r._count.userRoles,
    }));
  }

  /**
   * Detail d'un role avec permissions groupees par module.
   */
  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) throw new NotFoundException("Role introuvable");

    // Grouper par module
    const byModule: Record<string, any[]> = {};
    role.rolePermissions.forEach((rp) => {
      const mod = rp.permission.module;
      if (!byModule[mod]) byModule[mod] = [];
      byModule[mod].push({
        id: rp.permission.id,
        code: rp.permission.code,
        action: rp.permission.action,
        description: rp.permission.description,
      });
    });

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      usersCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => rp.permission.id),
      permissionsByModule: byModule,
    };
  }

  /**
   * Cree un role.
   */
  async create(dto: { code: string; name: string; description?: string }) {
    const existing = await this.prisma.role.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException("Ce code de role existe deja");

    return this.prisma.role.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        isSystem: false,
      },
    });
  }

  /**
   * Modifie un role.
   */
  async update(id: string, dto: { name?: string; description?: string }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException("Role introuvable");

    // Interdire modification des roles systeme (sauf description)
    if (role.isSystem && dto.name) {
      throw new BadRequestException(
        "Impossible de renommer un role systeme",
      );
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  /**
   * Remplace TOUTES les permissions d'un role (mode matrice).
   */
  async setPermissions(id: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException("Role introuvable");

    // Interdire modification des permissions SUPER_ADMIN
    if (role.code === "SUPER_ADMIN") {
      throw new BadRequestException(
        "Impossible de modifier les permissions du SUPER_ADMIN",
      );
    }

    // Verifier que toutes les permissions existent
    const perms = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });
    if (perms.length !== permissionIds.length) {
      throw new BadRequestException("Certaines permissions sont invalides");
    }

    // Transaction : supprimer + recréer
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
        skipDuplicates: true,
      }),
    ]);

    return this.findOne(id);
  }

  /**
   * Ajoute une permission a un role.
   */
  async addPermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role introuvable");
    if (role.code === "SUPER_ADMIN") {
      throw new BadRequestException("SUPER_ADMIN a deja toutes les permissions");
    }

    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      create: { roleId, permissionId },
      update: {},
    });

    return this.findOne(roleId);
  }

  /**
   * Retire une permission d'un role.
   */
  async removePermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role introuvable");
    if (role.code === "SUPER_ADMIN") {
      throw new BadRequestException("Impossible de modifier SUPER_ADMIN");
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    return this.findOne(roleId);
  }

  /**
   * Supprime un role (si non systeme et non utilise).
   */
  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!role) throw new NotFoundException("Role introuvable");

    if (role.isSystem) {
      throw new BadRequestException("Impossible de supprimer un role systeme");
    }

    if (role._count.userRoles > 0) {
      throw new BadRequestException(
        `Ce role est utilise par ${role._count.userRoles} utilisateur(s)`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Liste toutes les permissions groupees par module.
   */
  async listPermissions() {
    const perms = await this.prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    const byModule: Record<string, any[]> = {};
    perms.forEach((p) => {
      if (!byModule[p.module]) byModule[p.module] = [];
      byModule[p.module].push({
        id: p.id,
        code: p.code,
        action: p.action,
        description: p.description,
      });
    });

    return {
      total: perms.length,
      modules: byModule,
    };
  }
}
