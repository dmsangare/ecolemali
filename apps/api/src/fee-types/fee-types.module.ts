import { Module } from "@nestjs/common";
import { FeeTypesController } from "./fee-types.controller";
import { FeeTypesService } from "./fee-types.service";

@Module({
  controllers: [FeeTypesController],
  providers: [FeeTypesService],
  exports: [FeeTypesService],
})
export class FeeTypesModule {}
