import { Module } from "@nestjs/common";
import { ReportCardsController } from "./report-cards.controller";
import { ReportCardsService } from "./report-cards.service";
import { AnnualResultsController } from "./annual-results.controller";
import { AnnualResultsService } from "./annual-results.service";
import { DashboardModule } from "../dashboard/dashboard.module";

@Module({
  imports: [DashboardModule],
  controllers: [ReportCardsController, AnnualResultsController],
  providers: [ReportCardsService, AnnualResultsService],
  exports: [ReportCardsService, AnnualResultsService],
})
export class ReportCardsModule {}
