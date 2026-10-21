import { Module } from '@nestjs/common';
import { ClassPdfController } from './class-pdf.controller';
import { ClassPdfService } from './class-pdf.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassPdfController],
  providers: [ClassPdfService],
  exports: [ClassPdfService],
})
export class ClassPdfModule {}
