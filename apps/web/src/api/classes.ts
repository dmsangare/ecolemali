import { api } from "@/lib/axios";
import type {
  ClassItem,
  CreateClassInput,
  ClassListFilters,
  Level,
  Room,
  TeacherSimple,
  AcademicYear,
  LevelCycle,
} from "@/types/class";

export const classesApi = {
  // ============================================================
  // CLASSES
  // ============================================================
  async list(filters: ClassListFilters = {}): Promise<ClassItem[]> {
    const { data } = await api.get("/classes", { params: filters });
    return data.data || data;
  },

  async getById(id: string): Promise<ClassItem> {
    const { data } = await api.get(`/classes/${id}`);
    return data.data || data;
  },

  async getDashboard(id: string): Promise<any> {
    const { data } = await api.get(`/classes/${id}/dashboard`);
    return data.data || data;
  },

  async create(input: CreateClassInput): Promise<ClassItem> {
    const { data } = await api.post("/classes", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateClassInput>): Promise<ClassItem> {
    const { data } = await api.patch(`/classes/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/classes/${id}`);
  },

  // ============================================================
  // NIVEAUX (Levels)
  // ============================================================
  async listLevels(cycle?: LevelCycle): Promise<Level[]> {
    const params = cycle ? { cycle } : {};
    const { data } = await api.get("/levels", { params });
    return data.data || data;
  },

  // ============================================================
  // SALLES (Rooms)
  // ============================================================
  async listRooms(): Promise<Room[]> {
    const { data } = await api.get("/rooms");
    return data.data || data;
  },

  // ============================================================
  // ENSEIGNANTS (Teachers)
  // ============================================================
  async listTeachers(): Promise<TeacherSimple[]> {
    const { data } = await api.get("/teachers");
    return data.data || data;
  },

  // ============================================================
  // ANNEES SCOLAIRES (Academic Years)
  // ============================================================
  async listAcademicYears(): Promise<AcademicYear[]> {
    const { data } = await api.get("/academic-years");
    return data.data || data;
  },

  async getCurrentAcademicYear(): Promise<AcademicYear | null> {
    try {
      const years = await this.listAcademicYears();
      return years.find((y) => y.isCurrent) || years[0] || null;
    } catch {
      return null;
    }
  },
};
