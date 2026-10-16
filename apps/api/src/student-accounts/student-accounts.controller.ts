import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { StudentAccountsService } from "./student-accounts.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Student Accounts")
@ApiBearerAuth("access-token")
@Controller("students/:studentId/account")
@UseGuards(SchoolScopeGuard)
export class StudentAccountsController {
  constructor(private readonly service: StudentAccountsService) {}

  @Get()
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Compte credit/debit d'un eleve" })
  async findOne(
    @Param("studentId") studentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.schoolId) throw new BadRequestException("Utilisateur sans ecole");
    return this.service.findByStudent(studentId, user.schoolId);
  }

  @Post("refund")
  @RequirePermissions("payment:create")
  @ApiOperation({ summary: "Rembourser le credit eleve (especes)" })
  async refund(
    @Param("studentId") studentId: string,
    @Body() body: { amount: number; note?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.schoolId) throw new BadRequestException("Utilisateur sans ecole");
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException("Montant requis > 0");
    }
    return this.service.refund(
      studentId,
      user.schoolId,
      Number(body.amount),
      user.id,
      body.note,
    );
  }

  @Post("apply-credit")
  @RequirePermissions("payment:create")
  @ApiOperation({ summary: "Utiliser le credit pour regler une facture" })
  async applyCredit(
    @Param("studentId") studentId: string,
    @Body() body: { invoiceId: string; amount: number },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.schoolId) throw new BadRequestException("Utilisateur sans ecole");
    if (!body.invoiceId || !body.amount || body.amount <= 0) {
      throw new BadRequestException("invoiceId et amount > 0 requis");
    }
    return this.service.applyCredit(
      studentId,
      user.schoolId,
      body.invoiceId,
      Number(body.amount),
      user.id,
    );
  }
}
