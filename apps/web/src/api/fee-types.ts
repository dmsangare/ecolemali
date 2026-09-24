import { api } from "@/lib/axios";
import type { FeeType, CreateFeeTypeInput } from "@/types/finance";

export interface FeeTypeFilters {
  category?: string;
}

export const feeTypesApi = {
  async list(filters: FeeTypeFilters = {}): Promise<FeeType[]> {
    const { data } = await api.get("/fee-types", { params: filters });
    return data.data || data;
  },

  async getById(id: string): Promise<FeeType> {
    const { data } = await api.get(`/fee-types/${id}`);
    return data.data || data;
  },

  async create(input: CreateFeeTypeInput): Promise<FeeType> {
    const { data } = await api.post("/fee-types", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateFeeTypeInput>): Promise<FeeType> {
    const { data } = await api.patch(`/fee-types/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/fee-types/${id}`);
  },
};
