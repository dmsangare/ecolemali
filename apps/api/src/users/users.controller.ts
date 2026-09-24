import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CurrentUser, CurrentUserPayload, RequirePermissions } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Users")
@ApiBearerAuth("access-token")
@Controller("users")
@UseGuards(SchoolScopeGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // IMPORTANT : /roles doit etre AVANT /:id
  @Get("roles")
  @RequirePermissions("user:view")
  @ApiOperation({ summary: "Liste des roles disponibles" })
  async listRoles() {
    return this.usersService.listRoles();
  }

  @Get()
  @RequirePermissions("user:view")
  @ApiOperation({ summary: "Liste des utilisateurs" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.usersService.findAll(schoolId, query.page, query.limit, query.q);
  }

  @Get(":id")
  @RequirePermissions("user:view")
  @ApiOperation({ summary: "Detail d un utilisateur" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions("user:create")
  @ApiOperation({ summary: "Creer un utilisateur" })
  async create(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: {
      email?: string;
      phone?: string;
      password: string;
      firstName: string;
      lastName: string;
      roleIds: string[];
    },
  ) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException("Le mot de passe doit contenir au moins 8 caracteres");
    }
    if (!dto.roleIds || dto.roleIds.length === 0) {
      throw new BadRequestException("Au moins un role est requis");
    }

    const schoolId = currentUser.roles.includes("SUPER_ADMIN") ? undefined : currentUser.schoolId!;

    return this.usersService.create({
      ...dto,
      schoolId: schoolId || undefined,
    });
  }

  @Patch(":id")
  @RequirePermissions("user:update")
  @ApiOperation({ summary: "Modifier un utilisateur" })
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Post(":id/reset-password")
  @RequirePermissions("user:update")
  @ApiOperation({ summary: "Reinitialiser le mot de passe" })
  async resetPassword(
    @Param("id") id: string,
    @Body() body: { newPassword: string },
  ) {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException("Mot de passe trop court (min 8)");
    }
    return this.usersService.resetPassword(id, body.newPassword);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("user:delete")
  @ApiOperation({ summary: "Supprimer un utilisateur" })
  async remove(@Param("id") id: string) {
    await this.usersService.remove(id);
  }
}
