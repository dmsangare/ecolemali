import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ExpensesService } from "./expenses.service";
import { ExpenseCreateSchema, ExpenseListFiltersSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Expenses")
@ApiBearerAuth("access-token")
@Controller("expenses")
@UseGuards(SchoolScopeGuard)
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  @RequirePermissions("expense:view")
  @ApiOperation({ summary: "Liste des depenses" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(ExpenseListFiltersSchema)) filters: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, filters);
  }

  @Get(":id")
  @RequirePermissions("expense:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("expense:create")
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(ExpenseCreateSchema)) dto: any,
  ) {
    if (!user.schoolId) {
      throw new BadRequestException("Utilisateur sans ecole");
    }
    return this.service.create(dto, user.id, user.schoolId);
  }

  @Patch(":id")
  @RequirePermissions("expense:update")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("expense:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
