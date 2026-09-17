import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SubjectsService } from "./subjects.service";
import { SubjectCreateSchema, SubjectUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Subjects")
@ApiBearerAuth("access-token")
@Controller("subjects")
@UseGuards(SchoolScopeGuard)
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  @RequirePermissions("subject:view")
  @ApiOperation({ summary: "Liste des matieres" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("q") q?: string,
    @Query("type") type?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, q, type);
  }

  @Get(":id")
  @RequirePermissions("subject:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/coefficients")
  @RequirePermissions("subject:view")
  @ApiOperation({ summary: "Coefficients de la matiere par niveau" })
  async getCoefficients(@Param("id") id: string) {
    return this.service.getCoefficients(id);
  }

  @Post()
  @RequirePermissions("subject:create")
  async create(@Body(new ZodValidationPipe(SubjectCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("subject:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(SubjectUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/coefficients")
  @RequirePermissions("subject:update")
  @ApiOperation({ summary: "Definir un coefficient pour un niveau" })
  async setCoefficient(
    @Param("id") subjectId: string,
    @Body() body: { levelId: string; coefficient: number; weeklyHours?: number },
  ) {
    return this.service.setCoefficient(subjectId, body.levelId, body.coefficient, body.weeklyHours);
  }

  @Delete(":id/coefficients/:levelId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("subject:update")
  async removeCoefficient(@Param("id") subjectId: string, @Param("levelId") levelId: string) {
    await this.service.removeCoefficient(subjectId, levelId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("subject:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
