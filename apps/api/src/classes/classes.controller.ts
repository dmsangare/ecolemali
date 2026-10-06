import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ClassesService } from "./classes.service";
import { ClassCreateSchema, ClassUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Classes")
@ApiBearerAuth("access-token")
@Controller("classes")
@UseGuards(SchoolScopeGuard)
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Get()
  @RequirePermissions("class:view")
  @ApiOperation({ summary: "Liste des classes" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query("academicYearId") academicYearId?: string,
    @Query("levelId") levelId?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, academicYearId, levelId);
  }

  @Get(":id")
  @RequirePermissions("class:view")
  async findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Get(":id/dashboard")
  @RequirePermissions("class:view")
  @ApiOperation({ summary: "Tableau de bord de la classe" })
  async getDashboard(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.getDashboard(id, user);
  }

  @Post()
  @RequirePermissions("class:create")
  @ApiOperation({ summary: "Creer une classe" })
  async create(
    @Body() rawDto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Nettoyage manuel : on ignore tout ce qui n'est pas attendu
    const dto: any = {
      schoolId: user.schoolId,
      academicYearId: rawDto?.academicYearId,
      levelId: rawDto?.levelId,
      code: String(rawDto?.code || "").trim().toUpperCase(),
      name: String(rawDto?.name || "").trim(),
      capacity: rawDto?.capacity ? Number(rawDto.capacity) : 50,
    };

    // Champs optionnels : on ne les ajoute que s'ils sont valides
    if (rawDto?.roomId && typeof rawDto.roomId === 'string' && rawDto.roomId.length > 10) {
      dto.roomId = rawDto.roomId;
    }
    if (rawDto?.mainTeacherId && typeof rawDto.mainTeacherId === 'string' && rawDto.mainTeacherId.length > 10) {
      dto.mainTeacherId = rawDto.mainTeacherId;
    }
    if (rawDto?.status && typeof rawDto.status === 'string') {
      dto.status = rawDto.status;
    }

    // Validation minimale
    if (!dto.academicYearId || !dto.levelId || !dto.code || !dto.name) {
      throw new (await import("@nestjs/common")).BadRequestException(
        "Champs requis manquants : academicYearId, levelId, code, name"
      );
    }

    // Log pour debug
    console.log("[CLASS CREATE] Payload nettoye:", JSON.stringify(dto));

    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("class:update")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ClassUpdateSchema)) dto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("class:delete")
  async remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.service.remove(id, user);
  }
}
