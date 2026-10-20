import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
  HttpCode, HttpStatus, UseGuards, NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { ReportCardsService } from "./report-cards.service";
import { generateReportCardPDF } from "./utils/report-card-pdf.util";
import { generateAnnualReportCardPDF } from "./utils/annual-report-card-pdf.util";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { ReportCardGenerateSchema, ReportCardUpdateSchema, ReportCardReopenSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("ReportCards")
@ApiBearerAuth("access-token")
@Controller("report-cards")
@UseGuards(SchoolScopeGuard)
export class ReportCardsController {
  constructor(private readonly service: ReportCardsService) {}

  @Get()
  @RequirePermissions("report_card:view")
  @ApiOperation({ summary: "Liste des bulletins" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("termId") termId?: string,
    @Query("classId") classId?: string,
    @Query("studentId") studentId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, termId, classId, studentId, user);
  }

  @Get(":id")
  @RequirePermissions("report_card:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get("student/:studentId/term/:termId")
  @RequirePermissions("report_card:view")
  @ApiOperation({ summary: "Bulletin d un eleve pour un trimestre" })
  async getStudentReport(@Param("studentId") studentId: string, @Param("termId") termId: string) {
    return this.service.getStudentReport(studentId, termId);
  }

  @Get("class/:classId/term/:termId/ranking")
  @RequirePermissions("report_card:view")
  @ApiOperation({ summary: "Classement d une classe" })
  async getClassRanking(@Param("classId") classId: string, @Param("termId") termId: string) {
    return this.service.getClassRanking(classId, termId);
  }

  @Post("generate")
  @RequirePermissions("report_card:create")
  @ApiOperation({ summary: "Generer les bulletins (calcul auto des moyennes et rangs)" })
  async generate(
    @Body(new ZodValidationPipe(ReportCardGenerateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.generate(dto, user);
  }

  @Patch(":id")
  @RequirePermissions("report_card:update")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReportCardUpdateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Post(":id/validate")
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Valider un bulletin" })
  async validate(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.validate(id, user);
  }

  @Post(":id/publish")
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Publier un bulletin" })
  async publish(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.publish(id, user);
  }

  @Post("class/:classId/term/:termId/publish")
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Publier tous les bulletins d une classe" })
  async publishByClass(@Param("classId") classId: string, @Param("termId") termId: string) {
    return this.service.publishByClass(classId, termId);
  }

  @Post(":id/reopen")
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Rouvrir un bulletin valide/publie (motif obligatoire)" })
  async reopen(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReportCardReopenSchema)) dto: { motive: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.reopen(id, dto.motive, user);
  }

  @Get(":id/export/pdf-annual")
  @RequirePermissions("report_card:export")
  @ApiOperation({ summary: "Exporter le bulletin ANNUEL en PDF" })
  async exportAnnualPDF(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const data = await this.service.getAnnualExportData(id, user);
    const buffer = await generateAnnualReportCardPDF(data as any);
    const safeName = data.studentName.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40);
    const filename = `bulletin-annuel-${safeName}-${data.academicYear.replace(/\s+/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post("class/:classId/pdf")
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions("report_card:export")
  @ApiOperation({ summary: "Générer un ZIP de tous les bulletins d'une classe (async)" })
  async generateClassPDF(
    @Param("classId") classId: string,
    @Body() body: { academicYearId: string; termId?: string; kind?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Créer un job dans la queue
    const connection = new IORedis(process.env.REDIS_URL || "redis://redis:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const queue = new Queue("pdf-generation", { connection });

    const job = await queue.add("class-pdf", {
      classId,
      academicYearId: body.academicYearId,
      termId: body.termId,
      kind: body.kind || "TRIMESTRIEL",
      requestedBy: user.id,
    });

    await queue.close();
    await connection.quit();

    return {
      jobId: job.id,
      status: "PENDING",
      message: "Génération en cours. Utilisez /report-cards/class-pdf/:jobId pour télécharger.",
    };
  }

  @Get("class-pdf/:jobId")
  @RequirePermissions("report_card:export")
  @ApiOperation({ summary: "Télécharger le ZIP des bulletins d'une classe" })
  async downloadClassPDF(
    @Param("jobId") jobId: string,
    @Res() res: Response,
  ) {
    const connection = new IORedis(process.env.REDIS_URL || "redis://redis:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const queue = new Queue("pdf-generation", { connection });
    const job = await queue.getJob(jobId);

    if (!job) {
      await queue.close();
      await connection.quit();
      throw new NotFoundException("Job introuvable");
    }

    const state = await job.getState();
    const returnValue = job.returnvalue;

    await queue.close();
    await connection.quit();

    if (state === "completed" && returnValue?.path) {
      return res.download(returnValue.path);
    }

    return res.json({
      jobId,
      state,
      progress: job.progress,
      returnValue: state === "completed" ? returnValue : undefined,
    });
  }

  @Get(":id/export/pdf")
  @RequirePermissions("report_card:export")
  @ApiOperation({ summary: "Exporter le bulletin en PDF" })
  async exportPDF(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const data = await this.service.getExportData(id, user);
    const buffer = await generateReportCardPDF(data as any);

    const safeName = data.studentName
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 40);
    const filename = `bulletin-${safeName}-${data.termName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("report_card:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
