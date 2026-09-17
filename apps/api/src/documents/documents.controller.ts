import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { DocumentsService } from "./documents.service";
import { DocumentTemplateCreateSchema, DocumentGenerateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Documents")
@ApiBearerAuth("access-token")
@Controller("documents")
@UseGuards(SchoolScopeGuard)
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  // ============================================================
  // TEMPLATES
  // ============================================================

  @Get("templates")
  @RequirePermissions("document:view")
  @ApiOperation({ summary: "Liste des modeles de documents" })
  async findAllTemplates(
    @CurrentUser() user: CurrentUserPayload,
    @Query("type") type?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAllTemplates(schoolId, type);
  }

  @Get("templates/:id")
  @RequirePermissions("document:view")
  async findTemplate(@Param("id") id: string) {
    return this.service.findTemplate(id);
  }

  @Post("templates")
  @RequirePermissions("document:create")
  @ApiOperation({ summary: "Creer un modele de document" })
  async createTemplate(@Body(new ZodValidationPipe(DocumentTemplateCreateSchema)) dto: any) {
    return this.service.createTemplate(dto);
  }

  @Patch("templates/:id")
  @RequirePermissions("document:update")
  async updateTemplate(@Param("id") id: string, @Body() dto: any) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete("templates/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("document:delete")
  async removeTemplate(@Param("id") id: string) {
    await this.service.removeTemplate(id);
  }

  // ============================================================
  // GENERATION
  // ============================================================

  @Post("generate")
  @RequirePermissions("document:create")
  @ApiOperation({ summary: "Generer un document a partir d un modele" })
  async generate(
    @CurrentUser("id") userId: string,
    @Body(new ZodValidationPipe(DocumentGenerateSchema)) dto: any,
  ) {
    return this.service.generate(dto, userId);
  }

  @Get("generated")
  @RequirePermissions("document:view")
  @ApiOperation({ summary: "Liste des documents generes" })
  async findAllGenerated(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("studentId") studentId?: string,
    @Query("templateId") templateId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAllGenerated(schoolId, query.page, query.limit, studentId, templateId);
  }

  @Get("generated/:id")
  @RequirePermissions("document:view")
  async findGenerated(@Param("id") id: string) {
    return this.service.findGenerated(id);
  }

  @Delete("generated/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("document:delete")
  async removeGenerated(@Param("id") id: string) {
    await this.service.removeGenerated(id);
  }
}
