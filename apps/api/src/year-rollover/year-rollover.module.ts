import { Module } from "@nestjs/common";
import { YearRolloverController } from "./year-rollover.controller";
import { YearRolloverService } from "./year-rollover.service";
import { ReportCardsModule } from "../report-cards/report-cards.module";

@Module({
  imports: [ReportCardsModule],
  controllers: [YearRolloverController],
  providers: [YearRolloverService],
  exports: [YearRolloverService],
})
export class YearRolloverModule {}
