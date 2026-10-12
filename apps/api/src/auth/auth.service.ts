import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { JwtPayload, JwtRefreshPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(identifier: string, password: string, ipAddress: string | null, userAgent: string | null) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    const logAuth = (success: boolean, reason?: string) =>
      this.prisma.authLog.create({
        data: { userId: user?.id || null, login: identifier, success, reason, ipAddress, userAgent },
      });

    if (!user) {
      await logAuth(false, "USER_NOT_FOUND");
      throw new UnauthorizedException("Identifiants invalides");
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logAuth(false, "ACCOUNT_LOCKED");
      throw new UnauthorizedException("Compte temporairement verrouille");
    }
    if (user.status !== "ACTIVE") {
      await logAuth(false, "STATUS_" + user.status);
      throw new UnauthorizedException("Compte desactive ou en attente");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const maxAttempts = this.config.get<number>("security.maxLoginAttempts", 5);
      const lockMin = this.config.get<number>("security.lockDurationMinutes", 15);

      const update: any = { failedAttempts: attempts };
      if (attempts >= maxAttempts) {
        update.lockedUntil = new Date(Date.now() + lockMin * 60 * 1000);
        update.status = "LOCKED";
      }
      await this.prisma.user.update({ where: { id: user.id }, data: update });
      await logAuth(false, "INVALID_PASSWORD");

      if (attempts >= maxAttempts) {
        throw new UnauthorizedException("Trop de tentatives echouees. Compte verrouille " + lockMin + " minutes.");
      }
      throw new UnauthorizedException("Mot de passe incorrect. " + (maxAttempts - attempts) + " tentative(s) restante(s).");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, status: "ACTIVE", lastLoginAt: new Date() },
    });
    await logAuth(true);

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
    );

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      phone: user.phone,
      schoolId: user.schoolId,
      roles,
      permissions,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        roles,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async refresh(userId: string, tokenId: string, ipAddress: string | null, userAgent: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Utilisateur invalide");

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
    );

    return this.generateTokens({
      id: user.id,
      email: user.email,
      phone: user.phone,
      schoolId: user.schoolId,
      roles,
      permissions,
    });
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: "Deconnexion reussie" };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        schoolId: true, status: true, mustChangePassword: true, lastLoginAt: true,
        school: { select: { id: true, name: true, code: true } },
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException("Utilisateur introuvable");

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
    );

    return { ...user, roles, permissions };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Utilisateur introuvable");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("Mot de passe actuel incorrect");

    const rounds = this.config.get<number>("security.bcryptRounds", 12);
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: "Mot de passe modifie avec succes" };
  }

  private async generateTokens(user: {
    id: string; email: string | null; phone: string | null;
    schoolId: string | null; roles: string[]; permissions: string[];
  }) {
    const accessPayload: JwtPayload = {
      sub: user.id, email: user.email, schoolId: user.schoolId,
      roles: user.roles, permissions: user.permissions,
    };

    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>("jwt.secret"),
      expiresIn: this.config.get<string>("jwt.expiresIn", "15m") as any,
    });

    const tokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = { sub: user.id, tokenId };

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.get<string>("jwt.refreshSecret"),
      expiresIn: this.config.get<string>("jwt.refreshExpiresIn", "7d") as any,
    });

    const decoded: any = this.jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: { id: tokenId, userId: user.id, tokenHash, expiresAt },
    });

    const decodedAccess: any = this.jwt.decode(accessToken);
    const expiresIn = decodedAccess.exp - decodedAccess.iat;

    return { accessToken, refreshToken, expiresIn, tokenType: "Bearer" };
  }
}
