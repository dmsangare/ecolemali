import { api } from "@/lib/axios";

export interface AppearanceSettings {
  primaryColor?: string; // ex. "#2563eb"
}

export interface TemplatesSettings {
  whatsappReminder?: string;
  receiptFooter?: string;
  reportCardComment?: string;
}

export interface ThresholdsSettings {
  excellent?: number;
  tresBien?: number;
  bien?: number;
  assezBien?: number;
  passable?: number;
  insuffisant?: number;
}

export interface HonorRollSettings {
  topN?: number;
}
export interface NumberingSettings {
  invoicePrefix?: string;
  receiptPrefix?: string;
}
export interface FinanceSettings {
  warningThreshold?: number;
  criticalThreshold?: number;
}
export interface BulletinRulesCycle {
  gradingScale: number;
  passMark: number;
  evaluations: number;
  hasCoefficients: boolean;
}

export interface BulletinRulesSettings {
  firstCycle: BulletinRulesCycle;
  secondCycle: BulletinRulesCycle;
}

export interface SettingsData {
  appearance?: AppearanceSettings;
  templates?: TemplatesSettings;
  thresholds?: ThresholdsSettings;
  honorRoll?: HonorRollSettings;
  numbering?: NumberingSettings;
  finance?: FinanceSettings;
  bulletinRules?: BulletinRulesSettings;
}

export interface Settings {
  id: string;
  schoolId: string;
  currency: string;
  locale: string;
  timezone: string;
  gradingScale: string;
  passMark: string;
  data: SettingsData | null;
  createdAt: string;
  updatedAt: string;
}

export const settingsApi = {
  async get(): Promise<Settings> {
    const response = await api.get("/settings");
    // L'API renvoie { id, schoolId, ..., data: { appearance, ... } }
    // On retourne l'objet Settings COMPLET (avec son champ .data)
    const payload = response.data;
    if (payload && typeof payload === "object" && "data" in payload && "schoolId" in payload) {
      return payload as Settings;
    }
    // Fallback : si le backend n'a pas enveloppe, on suppose que c'est deja Settings
    return payload as Settings;
  },

  async update(payload: Partial<Settings>): Promise<Settings> {
    const { data } = await api.patch("/settings", payload);
    return data.data || data;
  },

  async updateThresholds(thresholds: Partial<ThresholdsSettings>): Promise<Settings> {
    const current = await this.get();
    const merged = {
      ...(current.data || {}),
      thresholds: {
        ...(current.data?.thresholds || {}),
        ...thresholds,
      },
    };
    return this.update({ data: merged } as any);
  },

  async updateTemplates(templates: Partial<TemplatesSettings>): Promise<Settings> {
    const current = await this.get();
    const merged = {
      ...(current.data || {}),
      templates: {
        ...(current.data?.templates || {}),
        ...templates,
      },
    };
    return this.update({ data: merged } as any);
  },
  async updateFinance(finance: Partial<FinanceSettings>): Promise<Settings> {
    const current = await this.get();
    const merged = {
      ...(current.data || {}),
      finance: {
        ...(current.data?.finance || {}),
        ...finance,
      },
    };
    return this.update({ data: merged } as any);
  },

  async updateAppearance(appearance: AppearanceSettings): Promise<Settings> {
    // Recuperer les settings actuels puis fusionner le data
    const current = await this.get();
    const merged = {
      ...(current.data || {}),
      appearance: {
        ...(current.data?.appearance || {}),
        ...appearance,
      },
    };
    return this.update({ data: merged } as any);
  },
};
