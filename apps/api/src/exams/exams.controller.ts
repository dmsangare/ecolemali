import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ExamsService } from "./exams.service";
import {
  ExamCreateSchema,
  ExamUpdateSchema,
  ExamSessionCreateSchema,
  ExamGradesBulkSchema,
} from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";
import { ExamListQueryDto } from "./dto/exam-list-query.dto";

@ApiTags("Exams")
@ApiBearerAuth("access-token")
@Controller("exams")
@UseGuards(SchoolScopeGuard)
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // ============================================================
  // EXAMS
  // ============================================================

  @Get()
  @RequirePermissions("exam:view")
  @ApiOperation({ summary: "Liste des examens" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ExamListQueryDto,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      academicYearId: query.academicYearId,
      termId: query.termId,
      type: query.type,
      status: query.status,
    });
  }

  @Get(":id")
  @RequirePermissions("exam:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/results")
  @RequirePermissions("exam:view")
  @ApiOperation({ summary: "Resultats et statistiques de l examen" })
  async getResults(@Param("id") id: string) {
    return this.service.getResults(id);
  }

  @Post()
  @RequirePermissions("exam:create")
  @ApiOperation({ summary: "Creer un examen" })
  async create(@Body(new ZodValidationPipe(ExamCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("exam:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(ExamUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Patch(":id/status")
  @RequirePermissions("exam:update")
  @ApiOperation({ summary: "Changer le statut de l examen" })
  async updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("exam:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }

  // ============================================================
  // SESSIONS
  // ============================================================

  @Post(":id/sessions")
  @RequirePermissions("exam:update")
  @ApiOperation({ summary: "Creer une session d examen" })
  async createSession(
    @Param("id") examId: string,
    @Body(new ZodValidationPipe(ExamSessionCreateSchema)) dto: any,
  ) {
    return this.service.createSession({ ...dto, examId });
  }

  @Get("sessions/:id")
  @RequirePermissions("exam:view")
  @ApiOperation({ summary: "Detail d une session d examen" })
  async findSession(@Param("id") id: string) {
    return this.service.findSession(id);
  }

  @Get("sessions/:id/candidates")
  @RequirePermissions("exam:view")
  @ApiOperation({ summary: "Liste des candidats d une session" })
  async getCandidates(@Param("id") sessionId: string) {
    return this.service.getCandidates(sessionId);
  }

  @Post("sessions/:id/generate-candidates")
  @RequirePermissions("exam:update")
  @ApiOperation({ summary: "Generer automatiquement les candidats a partir des inscrits" })
  async generateCandidates(@Param("id") sessionId: string) {
    return this.service.generateCandidates(sessionId);
  }

  @Post("sessions/:id/grades")
  @RequirePermissions("exam:update")
  @ApiOperation({ summary: "Saisir les notes des candidats" })
  async enterGrades(
    @Param("id") sessionId: string,
    @Body(new ZodValidationPipe(ExamGradesBulkSchema)) dto: any,
  ) {
    return this.service.enterGrades(sessionId, dto);
  }

  @Get("sessions/:id/pv")
  @RequirePermissions("exam:view")
  @ApiOperation({ summary: "PV de la session (avec classement)" })
  async getPv(@Param("id") sessionId: string) {
    return this.service.getCandidatePv(sessionId);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("exam:delete")
  async removeSession(@Param("id") id: string) {
    await this.service.removeSession(id);
  }
}
