import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GuardiansService } from "./guardians.service";
import { GuardianCreateSchema, GuardianUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Guardians")
@ApiBearerAuth("access-token")
@Controller("guardians")
@UseGuards(SchoolScopeGuard)
export class GuardiansController {
  constructor(private readonly service: GuardiansService) {}

  @Get()
  @RequirePermissions("parent:view")
  @ApiOperation({ summary: "Liste des tuteurs" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: PaginationDto) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, query.q);
  }

  @Get(":id")
  @RequirePermissions("parent:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("parent:create")
  async create(@Body(new ZodValidationPipe(GuardianCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("parent:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(GuardianUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/students/:studentId")
  @RequirePermissions("parent:update")
  @ApiOperation({ summary: "Lier un tuteur a un eleve" })
  async link(
    @Param("id") guardianId: string,
    @Param("studentId") studentId: string,
    @Body() body: { isPrimary?: boolean },
  ) {
    return this.service.linkToStudent(guardianId, studentId, body?.isPrimary || false);
  }

  @Delete(":id/students/:studentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("parent:update")
  @ApiOperation({ summary: "Delier un tuteur d un eleve" })
  async unlink(@Param("id") guardianId: string, @Param("studentId") studentId: string) {
    await this.service.unlinkFromStudent(guardianId, studentId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("parent:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
