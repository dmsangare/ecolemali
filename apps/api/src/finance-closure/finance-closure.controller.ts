import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FinanceClosureService } from "./finance-closure.service";
import { ExecuteFinanceClosureSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import {
  RequirePermissions,
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("FinanceClosure")
@ApiBearerAuth("access-token")
@Controller("finance-closure")
@UseGuards(SchoolScopeGuard)
export class FinanceClosureController {
  constructor(private readonly service: FinanceClosureService) {}

  @Get("preview/:yearId")
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Apercu de la cloture financiere" })
  async preview(
    @Param("yearId") yearId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.preview(yearId, user);
  }

  @Post("execute")
  @RequirePermissions("invoice:update")
  @ApiOperation({ summary: "Executer la cloture financiere (report des soldes)" })
  async execute(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(ExecuteFinanceClosureSchema)) dto: any,
  ) {
    return this.service.execute(dto, user);
  }
}
