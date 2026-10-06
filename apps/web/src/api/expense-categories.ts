import { api } from "@/lib/axios";
import type { ExpenseCategory } from "@/types/finance";

export interface CreateExpenseCategoryInput {
  code: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive?: boolean;
}

export type UpdateExpenseCategoryInput = Partial<CreateExpenseCategoryInput>;

export const expenseCategoriesApi = {
  async list(): Promise<ExpenseCategory[]> {
    const { data } = await api.get("/expense-categories");
    return data.data || data;
  },

  async getById(id: string): Promise<ExpenseCategory> {
    const { data } = await api.get(`/expense-categories/${id}`);
    return data.data || data;
  },

  async create(input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
    const { data } = await api.post("/expense-categories", input);
    return data.data || data;
  },

  async update(
    id: string,
    input: UpdateExpenseCategoryInput,
  ): Promise<ExpenseCategory> {
    const { data } = await api.patch(`/expense-categories/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expense-categories/${id}`);
  },
};
