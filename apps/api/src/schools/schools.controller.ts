import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SchoolsService } from "./schools.service";
import { SchoolCreateSchema, SchoolUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions } from "../common/decorators";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Schools")
@ApiBearerAuth("access-token")
@Controller("schools")
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Liste des etablissements" })
  async findAll(@Query() query: PaginationDto) {
    return this.schoolsService.findAll(query.page, query.limit, query.q);
  }

  @Get(":id")
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Detail d un etablissement" })
  async findOne(@Param("id") id: string) {
    return this.schoolsService.findOne(id);
  }

  @Post()
  @RequirePermissions("school:create")
  @ApiOperation({ summary: "Creer un etablissement" })
  async create(@Body(new ZodValidationPipe(SchoolCreateSchema)) dto: any) {
    return this.schoolsService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("school:update")
  @ApiOperation({ summary: "Modifier un etablissement" })
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(SchoolUpdateSchema)) dto: any) {
    return this.schoolsService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("school:delete")
  @ApiOperation({ summary: "Supprimer un etablissement" })
  async remove(@Param("id") id: string) {
    await this.schoolsService.remove(id);
  }
}
