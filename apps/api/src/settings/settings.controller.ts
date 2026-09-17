import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Settings")
@ApiBearerAuth("access-token")
@Controller("settings")
@UseGuards(SchoolScopeGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @RequirePermissions("settings:view")
  @ApiOperation({ summary: "Parametres de l etablissement" })
  async get(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findBySchool(user.schoolId!);
  }

  @Patch()
  @RequirePermissions("settings:update")
  @ApiOperation({ summary: "Modifier les parametres" })
  async update(@CurrentUser() user: CurrentUserPayload, @Body() dto: any) {
    return this.service.update(user.schoolId!, dto);
  }
}
