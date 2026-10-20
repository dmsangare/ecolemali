import { Module } from "@nestjs/common";
import { AnnualDecisionsService } from "./annual-decisions.service";
import { AnnualDecisionsController } from "./annual-decisions.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AnnualDecisionsController],
  providers: [AnnualDecisionsService],
  exports: [AnnualDecisionsService],
})
export class AnnualDecisionsModule {}
