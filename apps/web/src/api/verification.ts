import { api } from "@/lib/axios";

export type DocumentType =
  | "ID_CARD"
  | "BULLETIN"
  | "RECEIPT"
  | "INVOICE"
  | "ATTESTATION"
  | "CERTIFICATE";

export interface SignDocumentInput {
  type: DocumentType;
  referenceId: string;
  meta?: Record<string, any>;
  expiresAt?: string;
}

export interface SignDocumentResult {
  shortCode: string;
  hmacToken: string;
  verificationUrl: string;
}

export interface VerificationPublicInfo {
  valid: boolean;
  revoked: boolean;
  type: DocumentType;
  schoolId: string;
  referenceId: string;
  meta: Record<string, any> | null;
  viewCount: number;
  createdAt: string;
}

export const verificationApi = {
  async sign(input: SignDocumentInput): Promise<SignDocumentResult> {
    const { data } = await api.post("/verification/sign", input);
    return data.data || data;
  },

  async revoke(shortCode: string, reason?: string): Promise<any> {
    const { data } = await api.post("/verification/revoke", {
      shortCode,
      reason,
    });
    return data.data || data;
  },

  async verifyPublic(shortCode: string): Promise<VerificationPublicInfo> {
    const { data } = await api.get(`/verify/${shortCode}`);
    return data.data || data;
  },

  async verifyWithToken(shortCode: string, token: string): Promise<any> {
    const { data } = await api.get(`/verify/${shortCode}/${token}`);
    return data.data || data;
  },
};
