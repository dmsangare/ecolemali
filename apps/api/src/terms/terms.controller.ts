import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TermsService } from "./terms.service";
import { TermCreateSchema, TermUpdateSchema, TermGenerateMonthlySchema, TermGenerateMonthlyDto } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";

@ApiTags("Terms")
@ApiBearerAuth("access-token")
@Controller("terms")
export class TermsController {
  constructor(private readonly service: TermsService) {}

  @Get()
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Liste des trimestres" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
  ) {
    return this.service.findAll(user, academicYearId);
  }

  @Get("current")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Trimestre en cours" })
  async findCurrent(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findCurrent(user);
  }

  @Get(":id")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Detail d un trimestre" })
  async findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions("academic_year:create")
  @ApiOperation({ summary: "Creer un trimestre" })
  async create(
    @Body(new ZodValidationPipe(TermCreateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(dto, user);
  }

  @Post("generate-monthly")
  @RequirePermissions("academic_year:create")
  @ApiOperation({ summary: "Creer les periodes mensuelles (compositions du 1er cycle) d'une annee scolaire" })
  async generateMonthly(
    @Body(new ZodValidationPipe(TermGenerateMonthlySchema)) dto: TermGenerateMonthlyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.generateMonthly(dto.academicYearId, user);
  }

  @Patch(":id")
  @RequirePermissions("academic_year:update")
  @ApiOperation({ summary: "Modifier un trimestre" })
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(TermUpdateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Post(":id/lock")
  @RequirePermissions("academic_year:lock")
  @ApiOperation({ summary: "Verrouiller un trimestre" })
  async lock(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.lock(id, user);
  }

  @Post(":id/unlock")
  @RequirePermissions("academic_year:lock")
  @ApiOperation({ summary: "Deverrouiller un trimestre" })
  async unlock(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.unlock(id, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("academic_year:delete")
  @ApiOperation({ summary: "Supprimer un trimestre" })
  async remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.service.remove(id, user);
  }
}
