import { Module } from "@nestjs/common";
import { SubjectDomainsService } from "./subject-domains.service";
import { SubjectDomainsController } from "./subject-domains.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SubjectDomainsController],
  providers: [SubjectDomainsService],
  exports: [SubjectDomainsService],
})
export class SubjectDomainsModule {}
