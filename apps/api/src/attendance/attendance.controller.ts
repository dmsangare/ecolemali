import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { AttendanceSessionCreateSchema, AttendanceBulkUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Attendance")
@ApiBearerAuth("access-token")
@Controller("attendance")
@UseGuards(SchoolScopeGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  // ============================================================
  // SESSIONS
  // ============================================================

  @Get("sessions")
  @RequirePermissions("attendance:view")
  @ApiOperation({ summary: "Liste des sessions de presence" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("classId") classId?: string,
    @Query("termId") termId?: string,
    @Query("teacherId") teacherId?: string,
    @Query("date") date?: string,
  ) {
    return this.service.findAll(query.page, query.limit, classId, termId, teacherId, date, user);
  }

  @Get("sessions/:id")
  @RequirePermissions("attendance:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("sessions")
  @RequirePermissions("attendance:create")
  @ApiOperation({ summary: "Creer une session de presence" })
  async create(@Body(new ZodValidationPipe(AttendanceSessionCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch("sessions/:id/records")
  @RequirePermissions("attendance:update")
  @ApiOperation({ summary: "Mettre a jour les enregistrements d une session" })
  async updateRecords(
    @Param("id") sessionId: string,
    @Body(new ZodValidationPipe(AttendanceBulkUpdateSchema)) dto: any,
  ) {
    return this.service.updateRecords(sessionId, dto);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("attendance:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }

  // ============================================================
  // RECORDS
  // ============================================================

  @Patch("records/:id/justify")
  @RequirePermissions("attendance:validate")
  @ApiOperation({ summary: "Justifier une absence" })
  async justify(@Param("id") id: string, @Body() body: { justification: string }) {
    return this.service.justifyRecord(id, body.justification);
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  @Get("stats/student/:studentId")
  @RequirePermissions("attendance:view")
  @ApiOperation({ summary: "Statistiques de presence d un eleve" })
  async studentStats(@Param("studentId") studentId: string, @Query("termId") termId?: string) {
    return this.service.getStudentStats(studentId, termId);
  }

  @Get("stats/class/:classId")
  @RequirePermissions("attendance:view")
  @ApiOperation({ summary: "Statistiques de presence d une classe" })
  async classStats(@Param("classId") classId: string, @Query("termId") termId?: string) {
    return this.service.getClassStats(classId, termId);
  }

  @Get("stats/today-absences")
  @RequirePermissions("attendance:view")
  @ApiOperation({ summary: "Absences du jour" })
  async todayAbsences(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getTodayAbsences(user.schoolId!);
  }
}
