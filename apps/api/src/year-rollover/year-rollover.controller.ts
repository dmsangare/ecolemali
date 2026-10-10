import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { YearRolloverService } from "./year-rollover.service";
import {
  PreviewYearRolloverSchema,
  ExecuteYearRolloverSchema,
} from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import {
  RequirePermissions,
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("YearRollover")
@ApiBearerAuth("access-token")
@Controller("year-rollover")
@UseGuards(SchoolScopeGuard)
export class YearRolloverController {
  constructor(private readonly service: YearRolloverService) {}

  @Post("preview")
  @RequirePermissions("academic_year:create")
  @ApiOperation({ summary: "Apercu du passage a l'annee suivante (sans ecriture)" })
  async preview(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(PreviewYearRolloverSchema)) dto: any,
  ) {
    return this.service.preview(dto, user);
  }

  @Post("execute")
  @RequirePermissions("academic_year:create")
  @ApiOperation({ summary: "Executer le passage (creation de l'annee N+1)" })
  async execute(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(ExecuteYearRolloverSchema)) dto: any,
  ) {
    return this.service.execute(dto, user);
  }
}
