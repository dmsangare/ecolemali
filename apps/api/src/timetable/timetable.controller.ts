import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TimetableService } from "./timetable.service";
import { TimetableSlotCreateSchema, TimetableSlotUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Timetable")
@ApiBearerAuth("access-token")
@Controller("timetable-slots")
@UseGuards(SchoolScopeGuard)
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Get()
  @RequirePermissions("timetable:view")
  @ApiOperation({ summary: "Liste des creneaux" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
    @Query("classId") classId?: string,
    @Query("teacherId") teacherId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, academicYearId, classId, teacherId, user);
  }

  @Get("class/:classId")
  @RequirePermissions("timetable:view")
  @ApiOperation({ summary: "Emploi du temps d une classe" })
  async getByClass(@Param("classId") classId: string) {
    return this.service.getByClass(classId);
  }

  @Get("teacher/:teacherId")
  @RequirePermissions("timetable:view")
  @ApiOperation({ summary: "Emploi du temps d un enseignant" })
  async getByTeacher(@Param("teacherId") teacherId: string) {
    return this.service.getByTeacher(teacherId);
  }

  @Get(":id")
  @RequirePermissions("timetable:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("check-conflicts")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("timetable:view")
  @ApiOperation({ summary: "Verifier les conflits d un creneau" })
  async checkConflicts(@Body(new ZodValidationPipe(TimetableSlotCreateSchema)) dto: any) {
    return this.service.checkConflicts(dto);
  }

  @Post()
  @RequirePermissions("timetable:create")
  @ApiOperation({ summary: "Creer un creneau (verifie les conflits)" })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(TimetableSlotCreateSchema)) dto: any,
  ) {
    return this.service.create({ ...dto, schoolId: user.schoolId });
  }

  @Patch(":id")
  @RequirePermissions("timetable:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(TimetableSlotUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Delete("class/:classId/year/:academicYearId")
  @RequirePermissions("timetable:delete")
  @ApiOperation({ summary: "Supprimer l emploi du temps d une classe" })
  async removeByClass(
    @Param("classId") classId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.service.removeByClass(classId, academicYearId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("timetable:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
