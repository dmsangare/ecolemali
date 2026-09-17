import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
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
  constructor(private readonly service: InvoicesService) {}

  @Get()
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Liste des factures" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string,
    @Query("academicYearId") academicYearId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      studentId, status, academicYearId, q: query.q,
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
