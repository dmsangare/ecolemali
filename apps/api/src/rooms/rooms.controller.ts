import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { RoomCreateSchema, RoomUpdateSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Rooms")
@ApiBearerAuth("access-token")
@Controller("rooms")
@UseGuards(SchoolScopeGuard)
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  @Get()
  @RequirePermissions("class:view")
  @ApiOperation({ summary: "Liste des salles" })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query("type") type?: string) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, type);
  }

  @Get(":id")
  @RequirePermissions("class:view")
  async findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions("class:create")
  async create(@Body(new ZodValidationPipe(RoomCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("class:update")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RoomUpdateSchema)) dto: any,
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
