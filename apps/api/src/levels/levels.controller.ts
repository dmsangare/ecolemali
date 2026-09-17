import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { LevelsService } from "./levels.service";
import { LevelCreateSchema, LevelUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Levels")
@ApiBearerAuth("access-token")
@Controller("levels")
@UseGuards(SchoolScopeGuard)
export class LevelsController {
  constructor(private readonly service: LevelsService) {}

  @Get()
  @RequirePermissions("level:view")
  @ApiOperation({ summary: "Liste des niveaux" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query("cycle") cycle?: string) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, cycle);
  }

  @Get(":id")
  @RequirePermissions("level:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("level:create")
  async create(@Body(new ZodValidationPipe(LevelCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("level:update")
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(LevelUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("level:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
