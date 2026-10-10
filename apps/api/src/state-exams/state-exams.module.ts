import { Module } from "@nestjs/common";
import { StateExamsController } from "./state-exams.controller";
import { StateExamsService } from "./state-exams.service";

@Module({
  controllers: [StateExamsController],
  providers: [StateExamsService],
  exports: [StateExamsService],
})
export class StateExamsModule {}
