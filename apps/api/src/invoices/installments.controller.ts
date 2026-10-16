import {
  Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus,
  UseGuards, Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InstallmentsService } from "./installments.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { InstallmentMode } from "@prisma/client";

@ApiTags("Installments")
@ApiBearerAuth("access-token")
@Controller()
@UseGuards(SchoolScopeGuard)
export class InstallmentsController {
  constructor(private readonly service: InstallmentsService) {}

  // ============================================================
  // LISTE DES ECHEANCES D'UNE FACTURE
  // ============================================================

  @Get("invoices/:invoiceId/installments")
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Liste les echeances d'une facture" })
  async findByInvoice(
    @Param("invoiceId") invoiceId: string,
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    return this.service.findAllByInvoice(invoiceId);
  }

  // ============================================================
  // LISTE GLOBALE DES ECHEANCES NON SOLDEES (Recouvrement)
  // ============================================================

  @Get("installments/pending")
  @RequirePermissions("invoice:view")
  @ApiOperation({
    summary: "Liste toutes les echeances non soldees de l'ecole",
  })
  async findAllPending(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: any,
  ) {
    const query = req.query || {};
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAllPending({
      schoolId,
      status: query.status,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    });
  }

  // ============================================================
  // GENERATION AUTOMATIQUE
  // ============================================================

  @Post("invoices/:invoiceId/installments/generate")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Genere l'echeancier d'une facture" })
  async generate(
    @Param("invoiceId") invoiceId: string,
    @Body() body: {
      mode?: InstallmentMode;
      customCount?: number;
      feeTypeLabel?: string;
      dayOfMonth?: number;
    },
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    return this.service.generateForInvoice({
      invoiceId,
      mode: body.mode,
      customCount: body.customCount,
      feeTypeLabel: body.feeTypeLabel,
      dayOfMonth: body.dayOfMonth,
    });
  }

  // ============================================================
  // AJOUT MANUEL
  // ============================================================

  @Post("invoices/:invoiceId/installments")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Ajoute une echeance manuellement" })
  async create(
    @Param("invoiceId") invoiceId: string,
    @Body() dto: {
      label: string;
      amount: number;
      dueDate?: string | null;
      orderIndex?: number;
    },
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    return this.service.create(invoiceId, dto);
  }

  // ============================================================
  // MODIFIER UNE ECHEANCE
  // ============================================================

  @Patch("installments/:id")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Modifie une echeance" })
  async update(
    @Param("id") id: string,
    @Body() dto: {
      label?: string;
      amount?: number;
      dueDate?: string | null;
      orderIndex?: number;
    },
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto);
  }

  // ============================================================
  // SUPPRIMER UNE ECHEANCE
  // ============================================================

  @Delete("installments/:id")
  @RequirePermissions("invoice:update")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprime une echeance (si aucun paiement)" })
  async remove(
    @Param("id") id: string,
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    await this.service.remove(id);
  }

  // ============================================================
  // RECALCUL MANUEL
  // ============================================================

  @Post("installments/:id/recalculate")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Recalcule le statut d'une echeance" })
  async recalculate(
    @Param("id") id: string,
    @CurrentUser() _user: CurrentUserPayload,
  ) {
    await this.service.recalculateStatus(id);
    return { ok: true };
  }
}
