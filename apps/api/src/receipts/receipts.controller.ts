import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReceiptsService } from "./receipts.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Receipts")
@ApiBearerAuth("access-token")
@Controller("receipts")
@UseGuards(SchoolScopeGuard)
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Get()
  @RequirePermissions("payment:view")
  @ApiOperation({ summary: "Liste des recus" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: PaginationDto) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit);
  }

  @Get(":id")
  @RequirePermissions("payment:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get("number/:number")
  @RequirePermissions("payment:view")
  @ApiOperation({ summary: "Rechercher un recu par numero" })
  async findByNumber(@Param("number") number: string) {
    return this.service.findByNumber(number);
  }
}
