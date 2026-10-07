import {
  Controller, Get, Post, Body, Query, UseGuards, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MessagesService } from "./messages.service";
import { MessageCreateSchema, MessageListFiltersSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Messages")
@ApiBearerAuth("access-token")
@Controller("messages")
@UseGuards(SchoolScopeGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Historique des messages envoyes" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(MessageListFiltersSchema)) filters: any,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, filters);
  }

  @Get("reminders")
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Factures echues avec derniere relance" })
  async findReminders(
    @CurrentUser() user: CurrentUserPayload,
    @Query("minDaysLate") minDaysLate?: string,
    @Query("includeUpcoming") includeUpcoming?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    const days = minDaysLate ? parseInt(minDaysLate, 10) : 0;
    const upcoming = includeUpcoming === "true" || includeUpcoming === "1";
    return this.service.findReminders(schoolId, days, upcoming);
  }

  @Post()
  @RequirePermissions("invoice:view")
  @ApiOperation({ summary: "Enregistrer un message envoye" })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(MessageCreateSchema)) dto: any,
  ) {
    if (!user.schoolId) {
      throw new BadRequestException("Utilisateur sans ecole");
    }
    return this.service.create(dto, user.id, user.schoolId);
  }
}
