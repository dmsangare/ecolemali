import { Module } from "@nestjs/common";
import { SystemLogsController } from "./system-logs.controller";
import { SystemLogsService } from "./system-logs.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
})
export class SystemLogsModule {}
