import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminReportsService } from './admin-reports.service';
import {
  ListTemplatesQuerySchema,
  ListReportsQuerySchema,
} from './dto';

@Controller('admin-reports')
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  private sid(req: any): string {
    return req.user.schoolId;
  }

  // ============================================================
  // RAP-01 : Référentiel des modèles
  // ============================================================

  @Get('templates')
  async listTemplates(@Req() req: any, @Query() query: any) {
    const parsed = ListTemplatesQuerySchema.parse(query);
    return this.service.listTemplates(this.sid(req), parsed);
  }

  @Get('templates/:id')
  async getTemplate(@Req() req: any, @Param('id') id: string) {
    return this.service.getTemplate(this.sid(req), id);
  }

  // ============================================================
  // Rapports (instances)
  // ============================================================

  @Get('reports')
  async listReports(@Req() req: any, @Query() query: any) {
    const parsed = ListReportsQuerySchema.parse(query);
    return this.service.listReports(this.sid(req), parsed);
  }

  @Get('reports/:id')
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.service.getReport(this.sid(req), id);
  }

  // ============================================================
  // Health check du module
  // ============================================================

  @Get('health')
  health() {
    return { status: 'ok', module: 'admin-reports' };
  }
}
