import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AssessmentsService } from "./assessments.service";
import { AssessmentCreateSchema, AssessmentUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Assessments")
@ApiBearerAuth("access-token")
@Controller("assessments")
@UseGuards(SchoolScopeGuard)
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get()
  @RequirePermissions("assessment:view")
  @ApiOperation({ summary: "Liste des evaluations" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("classId") classId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("termId") termId?: string,
    @Query("teacherId") teacherId?: string,
    @Query("status") status?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      classId, subjectId, termId, teacherId, status,
    });
  }

  @Get(":id")
  @RequirePermissions("assessment:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("assessment:create")
  @ApiOperation({ summary: "Creer une evaluation" })
  async create(@Body(new ZodValidationPipe(AssessmentCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("assessment:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(AssessmentUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/open")
  @RequirePermissions("assessment:update")
  @ApiOperation({ summary: "Ouvrir la saisie des notes" })
  async open(@Param("id") id: string) {
    return this.service.open(id);
  }

  @Post(":id/submit")
  @RequirePermissions("assessment:update")
  @ApiOperation({ summary: "Soumettre l evaluation pour validation" })
  async submit(@Param("id") id: string) {
    return this.service.submit(id);
  }

  @Post(":id/validate")
  @RequirePermissions("assessment:validate")
  @ApiOperation({ summary: "Valider l evaluation" })
  async validate(@Param("id") id: string) {
    return this.service.validate(id);
  }

  @Post(":id/lock")
  @RequirePermissions("grade:lock")
  @ApiOperation({ summary: "Verrouiller l evaluation et ses notes" })
  async lock(@Param("id") id: string) {
    return this.service.lock(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("assessment:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
