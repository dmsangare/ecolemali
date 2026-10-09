import { api } from "@/lib/axios";

export interface AppearanceSettings {
  primaryColor?: string; // ex. "#2563eb"
}

export interface TemplatesSettings {
  whatsappReminder?: string;
  receiptFooter?: string;
  reportCardComment?: string;
}

export interface SettingsData {
  appearance?: AppearanceSettings;
  templates?: TemplatesSettings;
  thresholds?: Record<string, number>;
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
    const { data } = await api.get("/settings");
    return data.data || data;
  },

  async update(payload: Partial<Settings>): Promise<Settings> {
    const { data } = await api.patch("/settings", payload);
    return data.data || data;
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
