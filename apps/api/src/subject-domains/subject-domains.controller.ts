import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SubjectDomainsService } from "./subject-domains.service";
import { SubjectDomainCreateSchema, SubjectDomainUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";

@ApiTags("SubjectDomains")
@ApiBearerAuth("access-token")
@Controller("subject-domains")
export class SubjectDomainsController {
  constructor(private readonly service: SubjectDomainsService) {}

  @Get()
  @RequirePermissions("subject:view")
  @ApiOperation({ summary: "Liste des domaines" })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user);
  }

  @Get(":id")
  @RequirePermissions("subject:view")
  @ApiOperation({ summary: "Détail d'un domaine" })
  findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions("subject:create")
  @ApiOperation({ summary: "Créer un domaine" })
  create(
    @Body(new ZodValidationPipe(SubjectDomainCreateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(dto, user);
  }

  @Patch(":id")
  @RequirePermissions("subject:update")
  @ApiOperation({ summary: "Modifier un domaine" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SubjectDomainUpdateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(":id")
  @RequirePermissions("subject:delete")
  @ApiOperation({ summary: "Supprimer un domaine" })
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user);
  }
}
