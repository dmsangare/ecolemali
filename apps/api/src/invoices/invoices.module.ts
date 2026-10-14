import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { InstallmentsController } from "./installments.controller";
import { InstallmentsService } from "./installments.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  controllers: [InvoicesController, InstallmentsController],
  providers: [InvoicesService, InstallmentsService],
  exports: [InvoicesService, InstallmentsService],
})
export class InvoicesModule {}
