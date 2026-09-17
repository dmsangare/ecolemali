import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, CurrentUserPayload } from '../decorators';

@Injectable()
export class SchoolScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    if (!user) throw new ForbiddenException('Utilisateur non authentifie');
    if (user.roles?.includes('SUPER_ADMIN')) return true;

    const requestedSchoolId =
      request.body?.schoolId || request.query?.schoolId || request.params?.schoolId;

    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException("Vous n'avez pas acces aux donnees de cet etablissement");
    }
    if (!requestedSchoolId && user.schoolId) {
      request.body = { ...request.body, schoolId: user.schoolId };
    }
    return true;
  }
}