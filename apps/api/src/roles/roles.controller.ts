import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { RequirePermissions } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Roles")
@ApiBearerAuth("access-token")
@Controller("roles")
@UseGuards(SchoolScopeGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions("role:view")
  @ApiOperation({ summary: "Liste des roles" })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get("permissions")
  @RequirePermissions("role:view")
  @ApiOperation({ summary: "Toutes les permissions groupees par module" })
  async listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get(":id")
  @RequirePermissions("role:view")
  @ApiOperation({ summary: "Detail d un role avec ses permissions" })
  async findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions("role:create")
  @ApiOperation({ summary: "Creer un role" })
  async create(
    @Body() dto: { code: string; name: string; description?: string },
  ) {
    return this.rolesService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("role:update")
  @ApiOperation({ summary: "Modifier un role" })
  async update(
    @Param("id") id: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.rolesService.update(id, dto);
  }

  @Put(":id/permissions")
  @RequirePermissions("role:update")
  @ApiOperation({ summary: "Remplacer toutes les permissions d un role" })
  async setPermissions(
    @Param("id") id: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.rolesService.setPermissions(id, body.permissionIds);
  }

  @Post(":id/permissions/:permissionId")
  @RequirePermissions("role:update")
  @ApiOperation({ summary: "Ajouter une permission" })
  async addPermission(
    @Param("id") id: string,
    @Param("permissionId") permissionId: string,
  ) {
    return this.rolesService.addPermission(id, permissionId);
  }

  @Delete(":id/permissions/:permissionId")
  @RequirePermissions("role:update")
  @ApiOperation({ summary: "Retirer une permission" })
  async removePermission(
    @Param("id") id: string,
    @Param("permissionId") permissionId: string,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("role:delete")
  @ApiOperation({ summary: "Supprimer un role" })
  async remove(@Param("id") id: string) {
    await this.rolesService.remove(id);
  }
}
