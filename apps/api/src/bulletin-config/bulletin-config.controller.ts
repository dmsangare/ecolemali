import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { BulletinConfigService } from "./bulletin-config.service";
import { SchoolScopeGuard } from "../common/guards";
import { CurrentUser, CurrentUserPayload, RequirePermissions } from "../common/decorators";

@ApiTags("Bulletin Config")
@ApiBearerAuth("access-token")
@Controller("bulletin-config")
@UseGuards(SchoolScopeGuard)
export class BulletinConfigController {
  constructor(private readonly service: BulletinConfigService) {}

  @Get()
  @RequirePermissions("settings:view")
  @ApiOperation({ summary: "Configuration du bulletin de l'école" })
  async get(@CurrentUser() user: CurrentUserPayload) {
    return this.service.get(user.schoolId!);
  }

  @Patch()
  @RequirePermissions("settings:update")
  @ApiOperation({ summary: "Mettre à jour la configuration du bulletin" })
  async update(@CurrentUser() user: CurrentUserPayload, @Body() dto: any) {
    return this.service.update(user.schoolId!, dto);
  }
}
