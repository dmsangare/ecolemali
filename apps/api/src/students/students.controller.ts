import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { StudentsService } from "./students.service";
import { StudentCreateSchema, StudentUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Students")
@ApiBearerAuth("access-token")
@Controller("students")
@UseGuards(SchoolScopeGuard)
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Liste des eleves" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("classId") classId?: string,
    @Query("levelId") levelId?: string,
    @Query("status") status?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, query.q, classId, levelId, status);
  }

  @Get("stats")
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Statistiques des eleves" })
  async stats(@CurrentUser() user: CurrentUserPayload) {
    return this.service.statsBySchool(user.schoolId!);
  }

  @Get(":id")
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Detail d un eleve" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/pathway")
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Parcours scolaire de l eleve" })
  async getPathway(@Param("id") id: string) {
    return this.service.getPathway(id);
  }

  @Get(":id/documents")
  @RequirePermissions("student:view")
  @ApiOperation({ summary: "Documents de l eleve" })
  async getDocuments(@Param("id") id: string) {
    return this.service.getDocuments(id);
  }

  @Post()
  @RequirePermissions("student:create")
  @ApiOperation({ summary: "Creer un eleve" })
  async create(
    @CurrentUser("id") userId: string,
    @Body(new ZodValidationPipe(StudentCreateSchema)) dto: any,
  ) {
    return this.service.create(dto, userId);
  }

  @Patch(":id")
  @RequirePermissions("student:update")
  @ApiOperation({ summary: "Modifier un eleve" })
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(StudentUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/documents")
  @RequirePermissions("student:update")
  @ApiOperation({ summary: "Ajouter un document a l eleve" })
  async addDocument(
    @Param("id") studentId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: { type: string; fileUrl: string; fileName?: string; mimeType?: string; sizeBytes?: number },
  ) {
    return this.service.addDocument(studentId, dto, userId);
  }

  @Delete(":id/documents/:documentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("student:update")
  @ApiOperation({ summary: "Supprimer un document" })
  async removeDocument(@Param("id") studentId: string, @Param("documentId") documentId: string) {
    await this.service.removeDocument(studentId, documentId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("student:delete")
  @ApiOperation({ summary: "Supprimer un eleve (soft delete)" })
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
