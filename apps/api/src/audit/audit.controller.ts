import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Audit")
@ApiBearerAuth("access-token")
@Controller("audit-logs")
@UseGuards(SchoolScopeGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermissions("audit:view")
  @ApiOperation({ summary: "Liste des entrees d audit" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("userId") userId?: string,
    @Query("module") module?: string,
    @Query("action") action?: string,
    @Query("objectType") objectType?: string,
    @Query("objectId") objectId?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      userId, module, action, objectType, objectId, fromDate, toDate,
    });
  }

  @Get("object/:objectType/:objectId")
  @RequirePermissions("audit:view")
  @ApiOperation({ summary: "Historique d un objet" })
  async findByObject(
    @Param("objectType") objectType: string,
    @Param("objectId") objectId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findByObject(objectType, objectId, user);
  }

  @Get("user/:userId")
  @RequirePermissions("audit:view")
  @ApiOperation({ summary: "Actions d un utilisateur" })
  async findByUser(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
  ) {
    return this.service.findByUser(userId, user, query.page, query.limit);
  }

  @Get(":id")
  @RequirePermissions("audit:view")
  async findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }
}
