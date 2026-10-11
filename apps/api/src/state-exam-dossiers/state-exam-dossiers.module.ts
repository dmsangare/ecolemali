import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StateExamDossiersController } from './state-exam-dossiers.controller';
import { StateExamDossiersService } from './state-exam-dossiers.service';

@Module({
  imports: [PrismaModule],
  controllers: [StateExamDossiersController],
  providers: [StateExamDossiersService],
  exports: [StateExamDossiersService],
})
export class StateExamDossiersModule {}
