import { Module } from "@nestjs/common";
import { FinanceClosureController } from "./finance-closure.controller";
import { FinanceClosureService } from "./finance-closure.service";

@Module({
  controllers: [FinanceClosureController],
  providers: [FinanceClosureService],
  exports: [FinanceClosureService],
})
export class FinanceClosureModule {}
