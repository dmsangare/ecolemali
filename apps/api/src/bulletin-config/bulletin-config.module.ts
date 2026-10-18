import { Module } from "@nestjs/common";
import { BulletinConfigController } from "./bulletin-config.controller";
import { BulletinConfigService } from "./bulletin-config.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BulletinConfigController],
  providers: [BulletinConfigService],
  exports: [BulletinConfigService],
})
export class BulletinConfigModule {}
