import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TermsService } from "./terms.service";
import { TermCreateSchema, TermUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions } from "../common/decorators";

@ApiTags("Terms")
@ApiBearerAuth("access-token")
@Controller("terms")
export class TermsController {
  constructor(private readonly service: TermsService) {}

  @Get()
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Liste des trimestres" })
  async findAll(@Query("academicYearId") academicYearId?: string) {
    return this.service.findAll(academicYearId);
  }

  @Get("current")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Trimestre en cours" })
  async findCurrent() {
    return this.service.findCurrent();
  }

  @Get(":id")
  @RequirePermissions("academic_year:view")
  @ApiOperation({ summary: "Detail d un trimestre" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("academic_year:create")
  @ApiOperation({ summary: "Creer un trimestre" })
  async create(@Body(new ZodValidationPipe(TermCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("academic_year:update")
  @ApiOperation({ summary: "Modifier un trimestre" })
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(TermUpdateSchema)) dto: any) {
    return this.service.update(id, dto);
  }

  @Post(":id/lock")
  @RequirePermissions("academic_year:lock")
  @ApiOperation({ summary: "Verrouiller un trimestre" })
  async lock(@Param("id") id: string) {
    return this.service.lock(id);
  }

  @Post(":id/unlock")
  @RequirePermissions("academic_year:lock")
  @ApiOperation({ summary: "Deverrouiller un trimestre" })
  async unlock(@Param("id") id: string) {
    return this.service.unlock(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("academic_year:delete")
  @ApiOperation({ summary: "Supprimer un trimestre" })
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
