import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  BadRequestException,
  StreamableFile,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { createReadStream, existsSync } from "fs";
import { join, basename } from "path";
import { SchoolScopeGuard } from "../common/guards";
import { CurrentUser, CurrentUserPayload, RequirePermissions } from "../common/decorators";

@ApiTags("Files")
@ApiBearerAuth("access-token")
@Controller("files")
@UseGuards(SchoolScopeGuard)
export class FilesController {
  private readonly storageRoot = process.env.STORAGE_ROOT || "./storage";

  /**
   * Sert un document genere (HTML stocke) avec controle d'authentification.
   */
  @Get("documents/:filename")
  @RequirePermissions("document:view")
  @ApiOperation({ summary: "Recuperer un document genere (auth requise)" })
  async getDocument(
    @Param("filename") filename: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Securite : eviter les traversals de chemin
    const safeName = basename(filename);
    if (safeName !== filename) {
      throw new BadRequestException("Nom de fichier invalide");
    }

    const filePath = join(process.cwd(), this.storageRoot, "generated", safeName);
    if (!existsSync(filePath)) {
      throw new NotFoundException("Document introuvable");
    }

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    });
    return new StreamableFile(createReadStream(filePath));
  }

  /**
   * Sert une image uploadee (logo, photo eleve).
   */
  @Get("uploads/:filename")
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Recuperer un fichier uploade (auth requise)" })
  async getUpload(
    @Param("filename") filename: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const safeName = basename(filename);
    if (safeName !== filename) {
      throw new BadRequestException("Nom de fichier invalide");
    }

    const filePath = join(process.cwd(), this.storageRoot, "uploads", safeName);
    if (!existsSync(filePath)) {
      throw new NotFoundException("Fichier introuvable");
    }

    const ext = safeName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    res.set({
      "Content-Type": mimeTypes[ext || ""] || "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
    });
    return new StreamableFile(createReadStream(filePath));
  }
}
