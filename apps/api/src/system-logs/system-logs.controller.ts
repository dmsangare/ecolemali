import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SystemLogsService } from "./system-logs.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("System Logs")
@ApiBearerAuth("access-token")
@Controller("system-logs")
@UseGuards(SchoolScopeGuard)
export class SystemLogsController {
  constructor(private readonly service: SystemLogsService) {}

  @Get()
  @RequirePermissions("audit:view")
  @ApiOperation({ summary: "Journal systeme (erreurs 5xx)" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("level") level?: string,
    @Query("module") module?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findAll({
      level,
      module,
      fromDate,
      toDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
