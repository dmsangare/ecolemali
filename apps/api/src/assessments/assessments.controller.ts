import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { AssessmentsService } from "./assessments.service";
import { generateAssessmentPDF, generateAssessmentExcel, generateAssessmentCSV } from "./utils/assessment-export.util";
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
    @Query() query: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 200);

    return this.service.findAll(schoolId, page, limit, {
      classId: query.classId,
      subjectId: query.subjectId,
      termId: query.termId,
      teacherId: query.teacherId,
      status: query.status,
    }, user);
  }

  @Get(":id")
  @RequirePermissions("assessment:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("assessment:create")
  @ApiOperation({ summary: "Creer une evaluation" })
  async create(
    @Body() rawDto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Nettoyage manuel : on ignore tout ce qui n'est pas attendu
    const dto: any = {
      schoolId: user.schoolId,
      academicYearId: rawDto?.academicYearId,
      termId: rawDto?.termId,
      classId: rawDto?.classId,
      subjectId: rawDto?.subjectId,
      teacherId: rawDto?.teacherId,
      type: rawDto?.type || "DEVOIR",
      title: String(rawDto?.title || "").trim(),
      date: rawDto?.date,
      maxScore: Number(rawDto?.maxScore) || 20,
      coefficient: Number(rawDto?.coefficient) || 1,
    };

    if (rawDto?.durationMin) dto.durationMin = Number(rawDto.durationMin);
    if (rawDto?.observation) dto.observation = String(rawDto.observation);
    if (rawDto?.status) dto.status = rawDto.status;

    // Validation minimale
    if (!dto.academicYearId || !dto.termId || !dto.classId || !dto.subjectId || !dto.title || !dto.date) {
      const { BadRequestException } = await import("@nestjs/common");
      throw new BadRequestException(
        "Champs requis manquants : academicYearId, termId, classId, subjectId, title, date"
      );
    }


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

  @Post(":id/reopen")
  @RequirePermissions("assessment:update")
  @ApiOperation({ summary: "Reouvrir la saisie (Directeur)" })
  async reopen(@Param("id") id: string) {
    return this.service.reopen(id);
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  @Get(":id/export/pdf")
  @RequirePermissions("assessment:export")
  @ApiOperation({ summary: "Exporter en PDF" })
  async exportPDF(
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const data = await this.service.getExportData(id);
    const buffer = await generateAssessmentPDF(data);
    const filename = `fiche-notes-${data.assessmentTitle.replace(/[^a-z0-9]/gi, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(":id/export/excel")
  @RequirePermissions("assessment:export")
  @ApiOperation({ summary: "Exporter en Excel" })
  async exportExcel(
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const data = await this.service.getExportData(id);
    const buffer = await generateAssessmentExcel(data);
    const filename = `fiche-notes-${data.assessmentTitle.replace(/[^a-z0-9]/gi, "-")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(":id/export/csv")
  @RequirePermissions("assessment:export")
  @ApiOperation({ summary: "Exporter en CSV" })
  async exportCSV(
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const data = await this.service.getExportData(id);
    const csv = generateAssessmentCSV(data);
    const filename = `fiche-notes-${data.assessmentTitle.replace(/[^a-z0-9]/gi, "-")}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // BOM UTF-8 pour Excel
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("assessment:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
