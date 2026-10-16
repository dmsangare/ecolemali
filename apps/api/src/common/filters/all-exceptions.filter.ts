import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  // Client Prisma pour logger les erreurs 5xx en base (SystemLog).
  // Instancie directement (filtre non injectable facilement).
  private readonly prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Une erreur interne est survenue";
    let details: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") message = res;
      else if (typeof res === "object") {
        const r = res as any;
        message = r.message || message;
        if (Array.isArray(r.message)) {
          details = r.message.map((m: string) => ({ field: "validation", message: m }));
          message = "Erreur de validation des donnees";
        }
        if (r.details) details = r.details;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          message = "Un enregistrement avec cette valeur existe deja";
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Ressource introuvable";
          break;
        case "P2003":
          status = HttpStatus.BAD_REQUEST;
          message = "Reference invalide";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Erreur de base de donnees (${exception.code})`;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Donnees invalides envoyees a la base de donnees";
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      // Ecriture en base (asynchrone, non bloquante) — uniquement 5xx
      this.writeSystemLog(request, status, message, exception).catch(() => {
        // Silencieux : ne jamais casser la reponse HTTP a cause du logging
      });
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} : ${message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] || "Error",
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Ecrit une erreur 5xx dans system_logs (non bloquant).
   */
  private async writeSystemLog(
    request: Request,
    status: number,
    message: string | string[],
    exception: unknown,
  ): Promise<void> {
    try {
      const ctx = {
        method: request.method,
        url: request.url,
        status,
        params: request.params,
        query: request.query,
        body:
          request.method !== "GET"
            ? this.sanitizeBody(request.body)
            : undefined,
        userAgent: request.headers["user-agent"],
        stack:
          exception instanceof Error
            ? exception.stack?.slice(0, 2000)
            : undefined,
      };

      await this.prisma.systemLog.create({
        data: {
          level: "ERROR",
          module: this.detectModule(request.url),
          message: Array.isArray(message) ? message.join(" | ") : message,
          context: ctx as any,
        },
      });
    } catch {
      // Silencieux : ne jamais throw depuis le logger
    }
  }

  /**
   * Masque les donnees sensibles (password, tokens) dans le body.
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== "object") return body;
    const sensitive = [
      "password",
      "passwordHash",
      "token",
      "refreshToken",
      "accessToken",
      "secret",
    ];
    const copy: any = Array.isArray(body) ? [...body] : { ...body };
    for (const key of Object.keys(copy)) {
      if (
        sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()))
      ) {
        copy[key] = "[REDACTED]";
      } else if (typeof copy[key] === "object" && copy[key] !== null) {
        copy[key] = this.sanitizeBody(copy[key]);
      }
    }
    return copy;
  }

  /**
   * Extrait le module depuis l'URL (ex: /api/v1/students/xxx -> students).
   */
  private detectModule(url: string): string {
    const parts = url.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[0] === "api") return parts[2];
    return parts[0] || "unknown";
  }
}
