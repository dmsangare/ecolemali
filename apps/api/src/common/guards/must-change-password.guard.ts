import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

/**
 * Bloque l'acces a toute l'API tant que l'utilisateur n'a pas
 * change son mot de passe provisoire (mustChangePassword = true).
 *
 * Exceptions autorisees :
 *   - POST /auth/change-password
 *   - POST /auth/logout
 *   - GET  /auth/me
 *
 * Ce guard s'execute APRES JwtAuthGuard (donc request.user est rempli)
 * et AVANT PermissionsGuard (pour court-circuiter avant la verif de permission).
 */
@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // Routes exemptees (methode HTTP + chemin exact, sans le prefixe /api/v1)
  private static readonly ALLOWED: Array<{ method: string; path: string }> = [
    { method: "POST", path: "/auth/change-password" },
    { method: "POST", path: "/auth/logout" },
    { method: "GET", path: "/auth/me" },
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { mustChangePassword?: boolean } }>();

    const user = request.user;
    if (!user || !user.mustChangePassword) {
      return true;
    }

    // Normaliser le chemin : retirer le prefixe /api/v1 s'il est la
    const rawPath = request.path ?? request.url?.split("?")[0] ?? "";
    const path = rawPath.replace(/^\/api\/v\d+/, "");
    const method = (request.method ?? "GET").toUpperCase();

    const allowed = MustChangePasswordGuard.ALLOWED.some(
      (r) => r.method === method && r.path === path,
    );

    if (allowed) return true;

    throw new ForbiddenException({
      statusCode: 403,
      error: "MUST_CHANGE_PASSWORD",
      message:
        "Vous devez changer votre mot de passe provisoire avant de continuer.",
    });
  }
}
