import { Module } from "@nestjs/common";
import { StudentAccountsController } from "./student-accounts.controller";
import { StudentAccountsService } from "./student-accounts.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [StudentAccountsController],
  providers: [StudentAccountsService],
  exports: [StudentAccountsService],
})
export class StudentAccountsModule {}
