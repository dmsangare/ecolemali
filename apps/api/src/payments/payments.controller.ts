import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { PaymentsService } from "./payments.service";
import { generateReceiptPDF } from "./utils/receipt-pdf.util";
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
  async create(
    @Body() rawDto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Nettoyage manuel : injection schoolId + cashierId
    const dto: any = {
      schoolId: user.schoolId,
      cashierId: user.id,
      invoiceId: rawDto?.invoiceId,
      studentId: rawDto?.studentId,
      amount: Number(rawDto?.amount) || 0,
      method: rawDto?.method || "CASH",
    };

    if (rawDto?.reference) dto.reference = String(rawDto.reference).trim();

    // Validation minimale
    if (!dto.invoiceId || !dto.studentId || dto.amount <= 0) {
      const { BadRequestException } = await import("@nestjs/common");
      throw new BadRequestException(
        "Champs requis manquants : invoiceId, studentId, amount > 0"
      );
    }


    return this.service.create(dto);
  }

  @Post("settle-all")
  @RequirePermissions("payment:create")
  @ApiOperation({
    summary: "Solder plusieurs echeances en FIFO avec un seul montant",
  })
  async settleAll(
    @Body() rawDto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const dto: any = {
      schoolId: user.schoolId,
      cashierId: user.id,
      invoiceId: rawDto?.invoiceId,
      studentId: rawDto?.studentId,
      amount: Number(rawDto?.amount) || 0,
      method: rawDto?.method || "CASH",
      reference: rawDto?.reference,
    };

    if (!dto.invoiceId || !dto.studentId || dto.amount <= 0) {
      const { BadRequestException } = await import("@nestjs/common");
      throw new BadRequestException(
        "Champs requis : invoiceId, studentId, amount > 0",
      );
    }

    return this.service.settleAll(dto);
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
