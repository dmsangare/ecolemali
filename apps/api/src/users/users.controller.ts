import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
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

  @Get()
  @RequirePermissions("user:view")
  @ApiOperation({ summary: "Liste des utilisateurs" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: PaginationDto) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.usersService.findAll(schoolId, query.page, query.limit);
  }

  @Get(":id")
  @RequirePermissions("user:view")
  @ApiOperation({ summary: "Detail d un utilisateur" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }
}
