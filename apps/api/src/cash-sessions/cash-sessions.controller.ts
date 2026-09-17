import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CashSessionsService } from "./cash-sessions.service";
import { CashSessionOpenSchema, CashSessionCloseSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("CashSessions")
@ApiBearerAuth("access-token")
@Controller("cash-sessions")
@UseGuards(SchoolScopeGuard)
export class CashSessionsController {
  constructor(private readonly service: CashSessionsService) {}

  @Get()
  @RequirePermissions("cash:view")
  @ApiOperation({ summary: "Liste des sessions de caisse" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("status") status?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, status);
  }

  @Get("current")
  @RequirePermissions("cash:view")
  @ApiOperation({ summary: "Session ouverte du caissier connecte" })
  async getCurrent(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getCurrentOpen(user.schoolId!, user.id);
  }

  @Get(":id")
  @RequirePermissions("cash:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/report")
  @RequirePermissions("cash:view")
  @ApiOperation({ summary: "Rapport detaille de la session" })
  async getReport(@Param("id") id: string) {
    return this.service.getReport(id);
  }

  @Post("open")
  @RequirePermissions("cash:open")
  @ApiOperation({ summary: "Ouvrir une session de caisse" })
  async open(@Body(new ZodValidationPipe(CashSessionOpenSchema)) dto: any) {
    return this.service.open(dto);
  }

  @Post(":id/close")
  @RequirePermissions("cash:close")
  @ApiOperation({ summary: "Fermer la session avec comptage" })
  async close(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CashSessionCloseSchema)) dto: any,
  ) {
    return this.service.close(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("cash:close")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
