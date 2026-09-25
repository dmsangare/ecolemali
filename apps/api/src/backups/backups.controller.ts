import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  StreamableFile,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { createReadStream } from "fs";
import { BackupsService } from "./backups.service";
import {
  BackupListQuerySchema,
  BackupSettingsUpdateSchema,
  BackupRestoreSchema,
} from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import {
  RequirePermissions,
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Backups")
@ApiBearerAuth("access-token")
@Controller("backups")
@UseGuards(SchoolScopeGuard)
export class BackupsController {
  constructor(private readonly service: BackupsService) {}

  // ============================================================
  // ROUTES SPÉCIFIQUES (doivent être AVANT /:id)
  // ============================================================

  @Get("settings")
  @RequirePermissions("backup:view")
  @ApiOperation({ summary: "Configuration de la sauvegarde automatique" })
  async getSettings(@CurrentUser() user: CurrentUserPayload) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.getSettings(schoolId);
  }

  @Patch("settings")
  @RequirePermissions("backup:restore")
  @ApiOperation({ summary: "Modifier la configuration de sauvegarde" })
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(BackupSettingsUpdateSchema)) dto: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.updateSettings(schoolId as string, dto);
  }

  @Post("full")
  @RequirePermissions("backup:create")
  @ApiOperation({ summary: "Créer une sauvegarde complète (DB + documents)" })
  async createFull(@CurrentUser() user: CurrentUserPayload) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.createFullBackup(schoolId, user.id);
  }

  // ============================================================
  // ROUTES GÉNÉRIQUES
  // ============================================================

  @Get()
  @RequirePermissions("backup:view")
  @ApiOperation({ summary: "Liste des sauvegardes" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(BackupListQuerySchema)) query: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, query.type);
  }

  @Get(":id/download")
  @RequirePermissions("backup:view")
  @ApiOperation({ summary: "Télécharger un fichier de sauvegarde" })
  async download(
    @Param("id") id: string,
    @Query("part") part: "db" | "files" | "checksum",
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!part || !["db", "files", "checksum"].includes(part)) {
      throw new NotFoundException(
        "Paramètre 'part' requis (db, files ou checksum)",
      );
    }

    const { path: filePath, filename } = await this.service.getFilePath(
      id,
      part,
    );

    // Headers de téléchargement
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }

  @Get(":id")
  @RequirePermissions("backup:view")
  @ApiOperation({ summary: "Détail d'une sauvegarde" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("backup:create")
  @ApiOperation({ summary: "Créer une sauvegarde DB (compatibilité)" })
  async create(@CurrentUser() user: CurrentUserPayload) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.createDatabaseBackup(schoolId, user.id);
  }

  @Post(":id/restore")
  @RequirePermissions("backup:restore")
  @ApiOperation({
    summary: "Restaurer une sauvegarde (opération DESTRUCTIVE)",
  })
  async restore(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(BackupRestoreSchema)) dto: any,
  ) {
    return this.service.restore(id, user.id, dto.createSafetyBackup);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("backup:delete")
  @ApiOperation({ summary: "Supprimer une sauvegarde" })
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
