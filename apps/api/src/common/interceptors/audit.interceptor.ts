import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserPayload } from '../decorators';

const AUDITED_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    if (!AUDITED_METHODS.includes(method)) return next.handle();

    const user = request.user as CurrentUserPayload | undefined;

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          this.logAudit({
            userId: user?.id || null,
            schoolId: user?.schoolId || request.body?.schoolId || null,
            action: this.mapAction(method),
            module: this.extractPath(request.path),
            objectType: this.extractPath(request.path),
            objectId: responseData?.id || request.params?.id || null,
            newValue: this.sanitize(request.body),
            ipAddress: this.extractIp(request),
            userAgent: request.headers['user-agent'] || null,
          }).catch((err) => this.logger.error('Audit log failed', err));
        },
      }),
    );
  }

  private mapAction(method: string): string {
    if (method === 'POST') return 'CREATE';
    if (method === 'PATCH' || method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return 'UNKNOWN';
  }

  private extractPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[2] || 'unknown';
  }

  private extractIp(request: any): string | null {
    const xff = request.headers['x-forwarded-for'];
    if (xff) return Array.isArray(xff) ? xff[0] : xff.split(',')[0].trim();
    return request.ip || null;
  }

  private sanitize(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const SENSITIVE = ['password', 'passwordHash', 'newPassword', 'currentPassword', 'confirmPassword', 'refreshToken', 'accessToken', 'token'];
    const cleaned = { ...body };
    for (const key of SENSITIVE) if (key in cleaned) cleaned[key] = '[REDACTED]';
    return cleaned;
  }

  private async logAudit(data: any) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }
}