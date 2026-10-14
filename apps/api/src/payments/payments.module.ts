import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { SettingsModule } from "../settings/settings.module";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [SettingsModule, InvoicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
