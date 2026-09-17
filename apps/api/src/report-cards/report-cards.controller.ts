import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReportCardsService } from "./report-cards.service";
import { ReportCardGenerateSchema, ReportCardUpdateSchema } from "./dto";
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
    return this.service.findAll(schoolId, query.page, query.limit, termId, classId, studentId);
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
  @RequirePermissions("report_card:generate")
  @ApiOperation({ summary: "Generer les bulletins (calcul auto des moyennes et rangs)" })
  async generate(@Body(new ZodValidationPipe(ReportCardGenerateSchema)) dto: any) {
    return this.service.generate(dto);
  }

  @Patch(":id")
  @RequirePermissions("report_card:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(ReportCardUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/validate")
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Valider un bulletin" })
  async validate(@Param("id") id: string) {
    return this.service.validate(id);
  }

  @Post(":id/publish")
  @RequirePermissions("report_card:publish")
  @ApiOperation({ summary: "Publier un bulletin" })
  async publish(@Param("id") id: string) {
    return this.service.publish(id);
  }

  @Post("class/:classId/term/:termId/publish")
  @RequirePermissions("report_card:publish")
  @ApiOperation({ summary: "Publier tous les bulletins d une classe" })
  async publishByClass(@Param("classId") classId: string, @Param("termId") termId: string) {
    return this.service.publishByClass(classId, termId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("report_card:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
