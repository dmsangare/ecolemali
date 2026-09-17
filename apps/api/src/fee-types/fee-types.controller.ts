import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FeeTypesService } from "./fee-types.service";
import { FeeTypeCreateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("FeeTypes")
@ApiBearerAuth("access-token")
@Controller("fee-types")
@UseGuards(SchoolScopeGuard)
export class FeeTypesController {
  constructor(private readonly service: FeeTypesService) {}

  @Get()
  @RequirePermissions("fee:view")
  @ApiOperation({ summary: "Liste des types de frais" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query("category") category?: string) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, category);
  }

  @Get(":id")
  @RequirePermissions("fee:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("fee:create")
  async create(@Body(new ZodValidationPipe(FeeTypeCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("fee:update")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("fee:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
