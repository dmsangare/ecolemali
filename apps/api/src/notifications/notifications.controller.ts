import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { NotificationCreateSchema, NotificationBulkSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Notifications")
@ApiBearerAuth("access-token")
@Controller("notifications")
@UseGuards(SchoolScopeGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @RequirePermissions("notification:view")
  @ApiOperation({ summary: "Liste des notifications" })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
    @Query("userId") userId?: string,
    @Query("guardianId") guardianId?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    const schoolId = user.roles.includes("SUPER_ADMIN") ? null : user.schoolId;
    return this.service.findAll(schoolId, query.page, query.limit, {
      userId, guardianId, status, type,
      unreadOnly: unreadOnly === "true",
    });
  }

  @Get("unread-count")
  @RequirePermissions("notification:view")
  @ApiOperation({ summary: "Compteur de notifications non lues" })
  async unreadCount(
    @CurrentUser() user: CurrentUserPayload,
    @Query("guardianId") guardianId?: string,
  ) {
    return { count: await this.service.countUnread(user.id, guardianId) };
  }

  @Get(":id")
  @RequirePermissions("notification:view")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("notification:create")
  @ApiOperation({ summary: "Creer une notification" })
  async create(@Body(new ZodValidationPipe(NotificationCreateSchema)) dto: any) {
    return this.service.create(dto);
  }

  @Post("send-bulk")
  @RequirePermissions("notification:create")
  @ApiOperation({ summary: "Envoyer une notification a plusieurs destinataires" })
  async sendBulk(@Body(new ZodValidationPipe(NotificationBulkSchema)) dto: any) {
    return this.service.sendBulk(dto);
  }

  @Patch(":id/read")
  @RequirePermissions("notification:view")
  @ApiOperation({ summary: "Marquer une notification comme lue" })
  async markRead(@Param("id") id: string) {
    return this.service.markAsRead(id);
  }

  @Patch(":id/sent")
  @RequirePermissions("notification:create")
  @ApiOperation({ summary: "Marquer comme envoyee" })
  async markSent(@Param("id") id: string) {
    return this.service.markAsSent(id);
  }

  @Patch("read-all")
  @RequirePermissions("notification:view")
  @ApiOperation({ summary: "Marquer toutes les notifications comme lues" })
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.service.markAllAsRead(user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("notification:delete")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
