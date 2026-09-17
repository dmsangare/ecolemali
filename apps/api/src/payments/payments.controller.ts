import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { PaymentCreateSchema, PaymentCancelSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Payments")
@ApiBearerAuth("access-token")
@Controller("payments")
@UseGuards(SchoolScopeGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  @RequirePermissions("payment:view")
  @ApiOperation({ summary: "Liste des paiements" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("studentId") studentId?: string,
    @Query("invoiceId") invoiceId?: string,
    @Query("method") method?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      studentId, invoiceId, method, fromDate, toDate,
    });
  }

  @Get("today-total")
  @RequirePermissions("payment:view")
  @ApiOperation({ summary: "Recettes du jour" })
  async todayTotal(
    @CurrentUser() user: CurrentUserPayload,
    @Query("cashierId") cashierId?: string,
  ) {
    return this.service.getTodayTotal(user.schoolId!, cashierId);
  }

  @Get(":id")
  @RequirePermissions("payment:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("payment:create")
  @ApiOperation({ summary: "Enregistrer un paiement (genere le recu automatiquement)" })
  async create(@Body(new ZodValidationPipe(PaymentCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Post(":id/cancel")
  @RequirePermissions("payment:cancel")
  @ApiOperation({ summary: "Annuler un paiement" })
  async cancel(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PaymentCancelSchema)) dto: any,
  ) {
    return this.service.cancel(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("payment:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
