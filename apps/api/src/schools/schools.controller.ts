import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, BadRequestException, UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SchoolsService } from "./schools.service";
import { SchoolCreateSchema, SchoolUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SuperAdminOnlyGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Schools")
@ApiBearerAuth("access-token")
@Controller("schools")
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Liste des etablissements" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: PaginationDto) {
    return this.schoolsService.findAll(user, query.page, query.limit, query.q);
  }

  @Get(":id")
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Detail d un etablissement" })
  async findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.schoolsService.findOne(id, user);
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
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SchoolUpdateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.schoolsService.update(id, dto, user);
  }

  @Get(":id/setup-status")
  @RequirePermissions("school:view")
  @ApiOperation({ summary: "Etat de configuration de l ecole (wizard de demarrage)" })
  async getSetupStatus(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.schoolsService.getSetupStatus(id, user);
  }

  @Post(":id/setup-periods")
  @RequirePermissions("school:update")
  @ApiOperation({ summary: "Creer les periodes (trimestres et/ou mois)" })
  async createSetupPeriods(
    @Param("id") id: string,
    @Body() dto: { periods: "TRIMESTRE" | "MOIS" | "BOTH" },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.schoolsService.createSetupPeriods(id, user, dto);
  }

  @Post(":id/logo")
  @RequirePermissions("school:update")
  @ApiOperation({ summary: "Uploader le logo de l etablissement" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
    }),
  )
  async uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) throw new BadRequestException("Aucun fichier fourni");
    return this.schoolsService.uploadLogo(id, file, user);
  }

  @Post(":id/stamp")
  @RequirePermissions("school:update")
  @ApiOperation({ summary: "Uploader le tampon de l etablissement" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadStamp(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) throw new BadRequestException("Aucun fichier fourni");
    return this.schoolsService.uploadStamp(id, file, user);
  }

  @Post(":id/signature")
  @RequirePermissions("school:update")
  @ApiOperation({ summary: "Uploader la signature du directeur" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadSignature(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) throw new BadRequestException("Aucun fichier fourni");
    return this.schoolsService.uploadSignature(id, file, user);
  }

  @Delete(":id")
  @UseGuards(SuperAdminOnlyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("school:delete")
  @ApiOperation({ summary: "Supprimer un etablissement (SUPER_ADMIN uniquement)" })
  async remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.schoolsService.remove(id, user);
  }
}
