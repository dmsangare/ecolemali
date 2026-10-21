import { Controller, Get, Post, Body, Param, Res, UseGuards, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ClassPdfService } from './class-pdf.service';
import { GenerateClassPdfSchema } from './dto';
import { ZodValidationPipe } from '../../common/pipes';
import { RequirePermissions, CurrentUser, CurrentUserPayload } from '../../common/decorators';
import { SchoolScopeGuard } from '../../common/guards';

@ApiTags('ReportCards-ClassPdf')
@ApiBearerAuth('access-token')
@Controller('report-cards')
@UseGuards(SchoolScopeGuard)
export class ClassPdfController {
  constructor(private readonly service: ClassPdfService) {}

  @Post('class/:classId/pdf')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions('report_card:export')
  @ApiOperation({ summary: 'Lancer la génération du ZIP (async)' })
  async generate(
    @Param('classId') classId: string,
    @Body(new ZodValidationPipe(GenerateClassPdfSchema)) body: { academicYearId: string; termId?: string; kind?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const jobId = await this.service.createJob(classId, body.academicYearId, body.termId, body.kind || 'TRIMESTRIEL', user.schoolId ?? undefined);
    return { jobId, status: 'PENDING', message: `Génération en cours. GET /report-cards/class-pdf/${jobId}` };
  }

  @Get('class-pdf/:jobId')
  @RequirePermissions('report_card:export')
  @ApiOperation({ summary: 'Statut du job' })
  getStatus(@Param('jobId') jobId: string) {
    const job = this.service.getJob(jobId);
    if (!job) throw new NotFoundException('Job introuvable');
    return { jobId, status: job.status.toUpperCase(), progress: job.progress, count: job.count, error: job.error };
  }

  @Get('class-pdf/:jobId/download')
  @RequirePermissions('report_card:export')
  @ApiOperation({ summary: 'Télécharger le ZIP' })
  download(@Param('jobId') jobId: string, @Res() res: Response) {
    const job = this.service.getJob(jobId);
    if (!job) throw new NotFoundException('Job introuvable');
    if (job.status !== 'done' || !job.zipPath) throw new NotFoundException('ZIP non prêt');
    return res.download(job.zipPath);
  }
}
