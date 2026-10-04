import { api } from "@/lib/axios";
import type {
  Expense,
  ExpenseCategory,
  CreateExpenseInput,
  ExpenseFilters,
} from "@/types/finance";

export const expensesApi = {
  async list(filters: ExpenseFilters = {}): Promise<{
    items: Expense[];
    total: number;
    limit: number;
    offset: number;
    totalAmount: number;
  }> {
    const { data } = await api.get("/expenses", { params: filters });
    return data.data || data;
  },

  async getById(id: string): Promise<Expense> {
    const { data } = await api.get(`/expenses/${id}`);
    return data.data || data;
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const { data } = await api.post("/expenses", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateExpenseInput>): Promise<Expense> {
    const { data } = await api.patch(`/expenses/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
