import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TeacherAssignmentsService } from "./teacher-assignments.service";
import { TeacherAssignmentCreateSchema, BulkAssignmentSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions } from "../common/decorators";

@ApiTags("TeacherAssignments")
@ApiBearerAuth("access-token")
@Controller("teacher-assignments")
export class TeacherAssignmentsController {
  constructor(private readonly service: TeacherAssignmentsService) {}

  @Get()
  @RequirePermissions("assignment:view")
  @ApiOperation({ summary: "Liste des affectations" })
  async findAll(
    @Query("teacherId") teacherId?: string,
    @Query("classId") classId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.findAll(teacherId, classId, subjectId, academicYearId);
  }

  @Get(":id")
  @RequirePermissions("assignment:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("assignment:create")
  @ApiOperation({ summary: "Creer une affectation" })
  async create(@Body(new ZodValidationPipe(TeacherAssignmentCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Post("bulk")
  @RequirePermissions("assignment:create")
  @ApiOperation({ summary: "Creer plusieurs affectations pour un enseignant" })
  async createBulk(@Body(new ZodValidationPipe(BulkAssignmentSchema)) dto: any) {
    return this.service.createBulk(dto);
  }

  @Delete("teacher/:teacherId/year/:academicYearId")
  @RequirePermissions("assignment:delete")
  @ApiOperation({ summary: "Supprimer toutes les affectations d un enseignant pour une annee" })
  async removeBulk(
    @Param("teacherId") teacherId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.service.removeBulk(teacherId, academicYearId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("assignment:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
