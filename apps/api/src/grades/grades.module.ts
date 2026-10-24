import { Module } from "@nestjs/common";
import { GradesController } from "./grades.controller";
import { GradesService } from "./grades.service";
import { ReportCardsModule } from "../report-cards/report-cards.module";

@Module({
  imports: [ReportCardsModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
