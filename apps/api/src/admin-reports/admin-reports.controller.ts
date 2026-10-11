import {
  Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminReportsService } from './admin-reports.service';
import { ListTemplatesQuerySchema, ListReportsQuerySchema } from './dto';

@Controller('admin-reports')
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  private sid(req: any): string { return req.user.schoolId; }
  private uid(req: any): string { return req.user.id ?? req.user.userId; }

  @Get('health')
  health() { return { status: 'ok', module: 'admin-reports' }; }

  @Post('seed')
  async seed() { return this.service.ensureSeed(); }

  // --- Templates ---
  @Get('templates')
  async listTemplates(@Req() req: any, @Query() query: any) {
    return this.service.listTemplates(this.sid(req), ListTemplatesQuerySchema.parse(query));
  }

  @Get('templates/:id')
  async getTemplate(@Req() req: any, @Param('id') id: string) {
    return this.service.getTemplate(this.sid(req), id);
  }

  // --- Reports ---
  @Get('reports')
  async listReports(@Req() req: any, @Query() query: any) {
    return this.service.listReports(this.sid(req), ListReportsQuerySchema.parse(query));
  }

  @Get('reports/:id')
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.service.getReport(this.sid(req), id);
  }

  @Post('reports')
  async createReport(@Req() req: any, @Body() body: any) {
    return this.service.createReport(this.sid(req), this.uid(req), body);
  }

  @Post('reports/:id/generate')
  async generate(@Req() req: any, @Param('id') id: string) {
    return this.service.generateReport(this.sid(req), this.uid(req), id);
  }

  @Patch('reports/:id')
  async patch(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.patchReport(this.sid(req), this.uid(req), id, body);
  }
}
