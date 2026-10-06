import { NotFoundException } from "@nestjs/common";
import { CurrentUserPayload } from "../decorators";

export function isSuperAdmin(user: CurrentUserPayload | undefined | null): boolean {
  return !!user?.roles?.includes("SUPER_ADMIN");
}

/**
 * Verifie que la ressource appartient a l'etablissement de l'utilisateur.
 * Repond 404 (et non 403) pour ne pas reveler qu'une ressource existe ailleurs.
 */
export function assertSchoolAccess(
  user: CurrentUserPayload,
  resourceSchoolId: string | null | undefined,
  notFoundMessage = "Ressource introuvable",
): void {
  if (isSuperAdmin(user)) return;
  if (!user.schoolId || !resourceSchoolId || resourceSchoolId !== user.schoolId) {
    throw new NotFoundException(notFoundMessage);
  }
}

const NO_SCHOOL_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Filtre Prisma a fusionner dans un `where` :
 * - SUPER_ADMIN : aucun filtre ({}),
 * - autres : { schoolId } ; sans ecole rattachee, le filtre ne renvoie rien (jamais tout).
 */
export function schoolWhere(user: CurrentUserPayload): { schoolId?: string } {
  if (isSuperAdmin(user)) return {};
  return { schoolId: user.schoolId ?? NO_SCHOOL_ID };
}
