import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BulletinConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(schoolId: string) {
    let config = await this.prisma.bulletinConfig.findUnique({
      where: { schoolId },
    });

    if (!config) {
      config = await this.prisma.bulletinConfig.create({
        data: {
          schoolId,
          academy: "",
          cap: "",
          header1: "RÉPUBLIQUE DU MALI",
          header2: "Un Peuple - Un But - Une Foi",
          periodType: "TRIMESTRE",
          calculationMode: "WEIGHTED",
          useCoefficients: true,
          showQrCode: true,
          subjects: [],
          periods: [
            { name: "1er Trimestre", order: 1 },
            { name: "2ème Trimestre", order: 2 },
            { name: "3ème Trimestre", order: 3 },
          ],
          assessmentTypes: [
            { name: "Devoir 1", type: "DEVOIR", maxScore: 20, order: 1 },
            { name: "Devoir 2", type: "DEVOIR", maxScore: 20, order: 2 },
            { name: "Composition", type: "COMPOSITION", maxScore: 20, order: 3 },
          ],
        },
      });
    }

    return config;
  }

  async update(schoolId: string, data: any) {
    if (data.subjects && !Array.isArray(data.subjects)) {
      throw new BadRequestException("subjects doit être un tableau");
    }
    if (data.periods && !Array.isArray(data.periods)) {
      throw new BadRequestException("periods doit être un tableau");
    }
    if (data.assessmentTypes && !Array.isArray(data.assessmentTypes)) {
      throw new BadRequestException("assessmentTypes doit être un tableau");
    }

    return this.prisma.bulletinConfig.upsert({
      where: { schoolId },
      update: data,
      create: { schoolId, ...data },
    });
  }
}
