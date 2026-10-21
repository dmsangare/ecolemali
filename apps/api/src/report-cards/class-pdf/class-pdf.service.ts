import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as fsSync from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { generateReportCardPDF } from '../utils/report-card-pdf.util';
import { generateAnnualReportCardPDF } from '../utils/annual-report-card-pdf.util';

type JobStatus = 'pending' | 'processing' | 'done' | 'failed';
interface Job {
  status: JobStatus;
  progress: number;
  zipPath?: string;
  error?: string;
  count?: number;
  createdAt: number;
}

@Injectable()
export class ClassPdfService {
  private readonly logger = new Logger(ClassPdfService.name);
  private readonly jobs = new Map<string, Job>();
  private readonly jobsDir = '/app/storage/generated';

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.jobsDir)) {
      fs.mkdirSync(this.jobsDir, { recursive: true });
    }
  }

  async createJob(classId: string, academicYearId: string, termId: string | undefined, kind: string, schoolId?: string): Promise<string> {
    const jobId = randomUUID();
    this.jobs.set(jobId, { status: 'pending', progress: 0, createdAt: Date.now() });

    // Lancer sans attendre
    this.processJob(jobId, classId, academicYearId, termId, kind, schoolId).catch((err) => {
      this.logger.error(`[ClassPdf ${jobId}] ${err.message}`);
      this.jobs.set(jobId, { status: 'failed', progress: 0, error: err.message, createdAt: Date.now() });
    });

    return jobId;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  private async processJob(jobId: string, classId: string, academicYearId: string, termId: string | undefined, kind: string, schoolId?: string) {
    this.jobs.set(jobId, { status: 'processing', progress: 5, createdAt: Date.now() });

    const where: any = { classId, academicYearId };
    if (termId) where.termId = termId;
    if (schoolId) where.student = { schoolId };

    const reports = await this.prisma.reportCard.findMany({
      where,
      include: {
        student: true,
        class: { include: { level: true } },
        term: true,
        academicYear: true,
        items: { include: { subject: true } },
      },
    });

    if (reports.length === 0) {
      this.jobs.set(jobId, { status: 'done', progress: 100, count: 0, createdAt: Date.now() });
      return;
    }

    const zipPath = path.join(this.jobsDir, `class-${classId}-${jobId}.zip`);
    const output = fsSync.createWriteStream(zipPath);
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    let processed = 0;
    for (const report of reports) {
      try {
        const data: any = {
          schoolName: 'SIS-MALI',
          studentName: `${report.student.lastName} ${report.student.firstName}`,
          studentMatricule: report.student.matricule,
          studentGender: report.student.gender,
          studentBirthDate: report.student.birthDate.toISOString().split('T')[0],
          studentBirthPlace: report.student.birthPlace,
          className: report.class?.name || '',
          classSize: report.classSize || 0,
          termName: report.term?.name || '',
          academicYear: report.academicYear?.label || '',
          items: report.items.map((i) => ({
            subjectName: i.subject?.name || '',
            coefficient: Number(i.coefficient),
            average: i.average !== null ? Number(i.average) : null,
            weighted: i.weighted !== null ? Number(i.weighted) : null,
            rank: i.rank,
          })),
          totalCoefficient: report.items.reduce((s, i) => s + Number(i.coefficient), 0),
          totalWeighted: report.items.reduce((s, i) => s + (Number(i.weighted) || 0), 0),
          generalAverage: report.average !== null ? Number(report.average) : null,
          rank: report.rank,
          scale: report.scale,
          absences: report.absencesCount,
          lates: report.latesCount,
        };
        const buffer = kind === 'ANNUEL' || report.kind === 'ANNUEL'
          ? await generateAnnualReportCardPDF(data)
          : await generateReportCardPDF(data);
        const safeName = `${report.student.lastName}-${report.student.firstName}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        archive.append(buffer, { name: `bulletin-${safeName}.pdf` });
      } catch (err: any) {
        this.logger.error(`[ClassPdf ${jobId}] Erreur PDF ${report.student.matricule}: ${err.message}`);
      }
      processed++;
      const progress = 5 + Math.round((processed / reports.length) * 90);
      this.jobs.set(jobId, { status: 'processing', progress, createdAt: Date.now() });
    }

    await archive.finalize();
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });

    this.jobs.set(jobId, { status: 'done', progress: 100, count: reports.length, zipPath, createdAt: Date.now() });
  }
}
