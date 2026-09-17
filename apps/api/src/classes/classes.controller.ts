import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ClassesService } from "./classes.service";
import { ClassCreateSchema, ClassUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Classes")
@ApiBearerAuth("access-token")
@Controller("classes")
@UseGuards(SchoolScopeGuard)
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Get()
  @RequirePermissions("class:view")
  @ApiOperation({ summary: "Liste des classes" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
    @Query("levelId") levelId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, academicYearId, levelId);
  }

  @Get(":id")
  @RequirePermissions("class:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/dashboard")
  @RequirePermissions("class:view")
  @ApiOperation({ summary: "Tableau de bord de la classe" })
  async getDashboard(@Param("id") id: string) {
    return this.service.getDashboard(id);
  }

  @Post()
  @RequirePermissions("class:create")
  async create(@Body(new ZodValidationPipe(ClassCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("class:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(ClassUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("class:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
