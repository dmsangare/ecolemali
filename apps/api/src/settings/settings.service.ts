import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const DEFAULT_HONOR_ROLL_TOP_N = 3;
export const DEFAULT_INVOICE_PREFIX = "FAC";
export const DEFAULT_RECEIPT_PREFIX = "REC";
export const DEFAULT_UNPAID_WARNING = 25000;   // FCFA - seuil d'attention
export const DEFAULT_UNPAID_CRITICAL = 100000; // FCFA - seuil critique
export const DEFAULT_MIN_COMPOSITIONS = 7; // minimum de compositions 1er cycle pour décision annuelle

type SettingData = Record<string, any>;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySchool(schoolId: string) {
    const setting = await this.prisma.setting.findUnique({ where: { schoolId } });
    if (setting) return setting;

    // Auto-creation : une ecole sans Setting ne doit JAMAIS produire un 404.
    // On cree un Setting vierge avec les valeurs par defaut du schema.
    try {
      return await this.prisma.setting.create({
        data: { schoolId },
      });
    } catch (err: any) {
      // Race condition : un autre appel a pu creer le Setting entre-temps
      const fallback = await this.prisma.setting.findUnique({ where: { schoolId } });
      if (fallback) return fallback;
      throw err;
    }
  }

  /**
   * Retourne Setting.data en garantissant que les cles connues existent
   * avec leurs valeurs par defaut. Ne modifie PAS la base.
   */
  async getDataWithDefaults(schoolId: string): Promise<SettingData> {
    const setting = await this.prisma.setting.findUnique({ where: { schoolId } });
    const data: SettingData = (setting?.data as SettingData) ?? {};
    return {
      ...data,
      honorRoll: {
        topN: DEFAULT_HONOR_ROLL_TOP_N,
        ...(data.honorRoll ?? {}),
      },
      numbering: {
        invoicePrefix: DEFAULT_INVOICE_PREFIX,
        receiptPrefix: DEFAULT_RECEIPT_PREFIX,
        ...(data.numbering ?? {}),
      },
      finance: {
        warningThreshold: DEFAULT_UNPAID_WARNING,
        criticalThreshold: DEFAULT_UNPAID_CRITICAL,
        ...(data.finance ?? {}),
      },
      bulletinRules: {
        minCompositions: DEFAULT_MIN_COMPOSITIONS,
        ...(data.bulletinRules ?? {}),
      },
    };
  }

  async upsert(schoolId: string, data: any) {
    return this.prisma.setting.upsert({
      where: { schoolId },
      update: data,
      create: { schoolId, ...data },
    });
  }

  /**
   * Mise a jour avec MERGE PROFOND de la cle `data` (JSON).
   * Sans ce merge, un PATCH { data: { honorRoll } } ecraserait
   * appearance/templates/thresholds. Cas produit inacceptable.
   */
  async update(schoolId: string, payload: any) {
    const current = await this.prisma.setting.findUnique({ where: { schoolId } });
    if (!current) {
      return this.upsert(schoolId, payload);
    }

    const next: any = { ...payload };

    if (payload && typeof payload.data === "object" && payload.data !== null) {
      const currentData = (current.data as SettingData) ?? {};
      const merged: SettingData = { ...currentData };
      for (const [key, value] of Object.entries(payload.data)) {
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          typeof merged[key] === "object" &&
          merged[key] !== null &&
          !Array.isArray(merged[key])
        ) {
          merged[key] = { ...merged[key], ...(value as object) };
        } else {
          merged[key] = value as any;
        }
      }
      next.data = merged;
    }

    return this.prisma.setting.update({ where: { schoolId }, data: next });
  }
}
