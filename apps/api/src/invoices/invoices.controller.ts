import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
  HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { ImportSituationService } from "./import-situation.service";
import { InvoiceCreateSchema, InvoiceCancelSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Invoices")
@ApiBearerAuth("access-token")
@Controller("invoices")
@UseGuards(SchoolScopeGuard)
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly importSituation: ImportSituationService,
  ) {}

  @Get()
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Liste des factures" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 200);

    return this.service.findAll(schoolId, page, limit, {
      studentId: query.studentId,
      status: query.status,
      academicYearId: query.academicYearId,
      q: query.q,
    });
  }

  @Get("dashboard")
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Tableau de bord financier" })
  async dashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.getDashboard(user.schoolId!, academicYearId);
  }


  // ============================================================
  // IMPORT SITUATION (Phase C)
  // ============================================================

  @Get("import-situation/template")
  @RequirePermissions("invoice:create")
  @ApiOperation({ summary: "Telecharger le template Excel pre-rempli" })
  async importSituationTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId: string,
    @Res() res: Response,
  ) {
    if (!academicYearId) {
      throw new BadRequestException("academicYearId requis");
    }
    const schoolId = user.schoolId!;
    const buffer = await this.importSituation.getTemplate(schoolId, academicYearId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="situation-import.xlsx"',
    );
    res.send(buffer);
  }

  @Post("import-situation/preview")
  @RequirePermissions("invoice:create")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: "Analyser un fichier Excel de situation (sans ecriture)" })
  async importSituationPreview(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId: string,
  ) {
    if (!file) throw new BadRequestException("Fichier Excel requis (champ 'file')");
    if (!academicYearId) throw new BadRequestException("academicYearId requis");
    return this.importSituation.preview(file.buffer, user.schoolId!, academicYearId);
  }

  @Post("import-situation/confirm")
  @RequirePermissions("invoice:create")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: "Confirmer l'import (transaction tout-ou-rien)" })
  async importSituationConfirm(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId: string,
  ) {
    if (!file) throw new BadRequestException("Fichier Excel requis (champ 'file')");
    if (!academicYearId) throw new BadRequestException("academicYearId requis");
    return this.importSituation.confirm(
      file.buffer,
      user.schoolId!,
      academicYearId,
      user.id,
    );
  }

  @Get(":id")
  @RequirePermissions("invoice:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("invoice:create")
  @ApiOperation({ summary: "Creer une facture" })
  async create(@Body(new ZodValidationPipe(InvoiceCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Post("auto/:studentId/year/:academicYearId")
  @RequirePermissions("invoice:create")
  @ApiOperation({ summary: "Facturation automatique d un eleve" })
  async autoInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Param("studentId") studentId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.service.autoInvoice(user.schoolId!, studentId, academicYearId);
  }

  @Post("auto/bulk/preview")
  @RequirePermissions("invoice:create")
  @ApiOperation({
    summary: "Apercu facturation en masse (nombre d'eleves concernes)",
  })
  async previewAutoInvoiceBulk(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { academicYearId: string; levelId?: string; classId?: string },
  ) {
    return this.service.previewAutoInvoiceBulk(
      user.schoolId!,
      body.academicYearId,
      { levelId: body.levelId, classId: body.classId },
    );
  }

  @Post("auto/bulk")
  @RequirePermissions("invoice:create")
  @ApiOperation({
    summary: "Facturation en masse (niveau ou classe)",
  })
  async autoInvoiceBulk(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { academicYearId: string; levelId?: string; classId?: string },
  ) {
    return this.service.autoInvoiceBulk(
      user.schoolId!,
      body.academicYearId,
      { levelId: body.levelId, classId: body.classId },
    );
  }

  @Post(":id/cancel")
  @RequirePermissions("invoice:cancel")
  @ApiOperation({ summary: "Annuler une facture" })
  async cancel(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(InvoiceCancelSchema)) dto: any,
  ) {
    return this.service.cancel(id, dto);
  }

  @Patch(":id/recalculate")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Recalculer le solde et le statut de la facture" })
  async recalculate(@Param("id") id: string) {
    return this.service.recalculateStatus(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("invoice:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
