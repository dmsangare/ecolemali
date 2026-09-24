export interface School {
  id: string;
  code: string;
  sigle: string | null;
  name: string;
  type: "FONDAMENTAL" | "PREMIER_CYCLE" | "DEUXIEME_CYCLE" | "LYCEE" | "FONDAMENTAL_LYCEE";
  status: "PUBLIC" | "PRIVE" | "CONFESSIONNEL" | "LAIC";
  address: string | null;
  region: string | null;
  cercle: string | null;
  commune: string | null;
  quarter: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  directorName: string | null;
  logoUrl: string | null;
  motto: string | null;
  createdYear: number | null;
  isActive: boolean;
  setting?: SystemSettings | null;
}

export interface SystemSettings {
  id: string;
  schoolId: string;
  currency: string;
  locale: string;
  timezone: string;
  gradingScale: string;
  passMark: string;
  data: any;
}

export interface UpdateSchoolInput {
  name?: string;
  sigle?: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  directorName?: string;
  logoUrl?: string;
}
