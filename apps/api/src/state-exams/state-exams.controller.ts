import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { StateExamsService } from "./state-exams.service";
import { SaveStateExamResultsSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import {
  RequirePermissions,
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("StateExams")
@ApiBearerAuth("access-token")
@Controller("state-exams")
@UseGuards(SchoolScopeGuard)
export class StateExamsController {
  constructor(private readonly service: StateExamsService) {}

  @Get("levels")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Liste des niveaux a examen d'Etat (DEF/BAC)" })
  async listLevels(@CurrentUser() user: CurrentUserPayload) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.listLevels(schoolId);
  }

  @Get("levels/:levelId/candidates")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Liste des eleves candidats pour un niveau" })
  async listCandidates(
    @Param("levelId") levelId: string,
    @Query("academicYearId") academicYearId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.listCandidates(levelId, academicYearId, user);
  }

  @Post("results")
  @RequirePermissions("academic_year:update")
  @ApiOperation({ summary: "Sauvegarder les resultats d'examen d'Etat" })
  async saveResults(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(SaveStateExamResultsSchema)) dto: any,
  ) {
    return this.service.saveResults(dto, user);
  }
}
