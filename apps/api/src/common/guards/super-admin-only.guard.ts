import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { CurrentUserPayload } from "../decorators";

@Injectable()
export class SuperAdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as CurrentUserPayload | undefined;
    if (!user?.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenException("Action reservee au super administrateur");
    }
    return true;
  }
}
