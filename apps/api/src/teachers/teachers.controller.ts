import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TeachersService } from "./teachers.service";
import { TeacherCreateSchema, TeacherUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Teachers")
@ApiBearerAuth("access-token")
@Controller("teachers")
@UseGuards(SchoolScopeGuard)
export class TeachersController {
  constructor(private readonly service: TeachersService) {}

  @Get()
  @RequirePermissions("teacher:view")
  @ApiOperation({ summary: "Liste des enseignants" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("status") status?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, query.q, status);
  }

  @Get(":id")
  @RequirePermissions("teacher:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/assignments")
  @RequirePermissions("teacher:view")
  @ApiOperation({ summary: "Affectations de l enseignant" })
  async getAssignments(@Param("id") id: string) {
    return this.service.getAssignments(id);
  }

  @Get(":id/timetable")
  @RequirePermissions("teacher:view")
  @ApiOperation({ summary: "Emploi du temps de l enseignant" })
  async getTimetable(@Param("id") id: string) {
    return this.service.getTimetable(id);
  }

  @Post()
  @RequirePermissions("teacher:create")
  @ApiOperation({ summary: "Creer un enseignant" })
  async create(
    @CurrentUser("id") userId: string,
    @Body(new ZodValidationPipe(TeacherCreateSchema)) dto: any,
  ) {
    return this.service.create(dto, userId);
  }

  @Patch(":id")
  @RequirePermissions("teacher:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(TeacherUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("teacher:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
