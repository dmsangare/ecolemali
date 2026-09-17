import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Reports")
@ApiBearerAuth("access-token")
@Controller("reports")
@UseGuards(SchoolScopeGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("dashboard")
  @RequirePermissions("report:view")
  @ApiOperation({ summary: "Tableau de bord direction" })
  async dashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.getDashboard(user.schoolId!, academicYearId);
  }

  @Get("students")
  @RequirePermissions("report:view")
  @ApiOperation({ summary: "Statistiques des eleves" })
  async students(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.getStudentStats(user.schoolId!, academicYearId);
  }

  @Get("pedagogical")
  @RequirePermissions("report:view")
  @ApiOperation({ summary: "Statistiques pedagogiques" })
  async pedagogical(
    @CurrentUser() user: CurrentUserPayload,
    @Query("termId") termId?: string,
  ) {
    return this.service.getPedagogicalStats(user.schoolId!, termId);
  }

  @Get("financial")
  @RequirePermissions("report:view")
  @ApiOperation({ summary: "Statistiques financieres" })
  async financial(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.getFinancialStats(user.schoolId!, academicYearId);
  }

  @Get("attendance")
  @RequirePermissions("report:view")
  @ApiOperation({ summary: "Statistiques de presence" })
  async attendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query("classId") classId?: string,
    @Query("termId") termId?: string,
  ) {
    return this.service.getAttendanceStats(user.schoolId!, classId, termId);
  }
}
