import { api } from "@/lib/axios";
import type {
  Student,
  StudentListFilters,
  PaginatedStudents,
  CreateStudentInput,
} from "@/types/student";

export const studentsApi = {
  async list(filters: StudentListFilters = {}): Promise<PaginatedStudents> {
    const { data } = await api.get("/students", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Student> {
    const { data } = await api.get(`/students/${id}`);
    return data.data || data;
  },

  async create(input: CreateStudentInput): Promise<Student> {
    const { data } = await api.post("/students", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateStudentInput>): Promise<Student> {
    const { data } = await api.patch(`/students/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async getStats(): Promise<any> {
    const { data } = await api.get("/students/stats");
    return data.data || data;
  },

  async getPathway(id: string): Promise<any[]> {
    const { data } = await api.get(`/students/${id}/pathway`);
    return data.data || data;
  },

  async getDocuments(id: string): Promise<any[]> {
    const { data } = await api.get(`/students/${id}/documents`);
    return data.data || data;
  },
};
