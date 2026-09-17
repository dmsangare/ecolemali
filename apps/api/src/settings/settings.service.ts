import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySchool(schoolId: string) {
    const setting = await this.prisma.setting.findUnique({ where: { schoolId } });
    if (!setting) throw new NotFoundException("Parametres introuvables pour cet etablissement");
    return setting;
  }

  async upsert(schoolId: string, data: any) {
    return this.prisma.setting.upsert({
      where: { schoolId },
      update: data,
      create: { schoolId, ...data },
    });
  }

  async update(schoolId: string, data: any) {
    return this.upsert(schoolId, data);
  }
}
