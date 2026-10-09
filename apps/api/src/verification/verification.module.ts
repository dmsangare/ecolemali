import { Module } from "@nestjs/common";
import {
  VerificationController,
  VerificationPublicController,
} from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  controllers: [VerificationPublicController, VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
