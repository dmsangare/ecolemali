import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ExpenseCategoriesService } from "./expense-categories.service";
import { ExpenseCategoryCreateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("ExpenseCategories")
@ApiBearerAuth("access-token")
@Controller("expense-categories")
@UseGuards(SchoolScopeGuard)
export class ExpenseCategoriesController {
  constructor(private readonly service: ExpenseCategoriesService) {}

  @Get()
  @RequirePermissions("expense:view")
  @ApiOperation({ summary: "Liste des categories de depenses" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("includeInactive") includeInactive?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, includeInactive === "true");
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
    @Body(new ZodValidationPipe(ExpenseCategoryCreateSchema)) dto: any,
  ) {
    if (!user.schoolId) throw new BadRequestException("Utilisateur sans ecole");
    return this.service.create(dto, user.schoolId);
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
