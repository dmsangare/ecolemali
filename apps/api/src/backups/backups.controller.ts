import {
  Controller, Get, Post, Delete, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { BackupsService } from "./backups.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Backups")
@ApiBearerAuth("access-token")
@Controller("backups")
@UseGuards(SchoolScopeGuard)
export class BackupsController {
  constructor(private readonly service: BackupsService) {}

  @Get()
  @RequirePermissions("backup:view")
  @ApiOperation({ summary: "Liste des sauvegardes" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("type") type?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, type);
  }

  @Get(":id")
  @RequirePermissions("backup:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("backup:create")
  @ApiOperation({ summary: "Declencher une sauvegarde de la base" })
  async create(
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.createDatabaseBackup(schoolId, user.id);
  }

  @Post(":id/restore")
  @RequirePermissions("backup:restore")
  @ApiOperation({ summary: "Restaurer une sauvegarde (operation destructive)" })
  async restore(@Param("id") id: string) {
    return this.service.restore(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("backup:restore")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
