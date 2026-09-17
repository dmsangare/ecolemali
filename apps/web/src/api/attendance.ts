import { api } from "@/lib/axios";
import type {
  AttendanceSession,
  CreateAttendanceInput,
  AttendanceStats,
} from "@/types/attendance";

export interface AttendanceSessionListFilters {
  page?: number;
  limit?: number;
  classId?: string;
  termId?: string;
  teacherId?: string;
  date?: string;
}

export const attendanceApi = {
  async listSessions(filters: AttendanceSessionListFilters = {}): Promise<any> {
    const { data } = await api.get("/attendance/sessions", { params: filters });
    return data.data ? data : data;
  },

  async getSession(id: string): Promise<AttendanceSession> {
    const { data } = await api.get(`/attendance/sessions/${id}`);
    return data.data || data;
  },

  async createSession(input: CreateAttendanceInput): Promise<AttendanceSession> {
    const { data } = await api.post("/attendance/sessions", input);
    return data.data || data;
  },

  async updateRecords(sessionId: string, records: any[]): Promise<AttendanceSession> {
    const { data } = await api.patch(`/attendance/sessions/${sessionId}/records`, {
      sessionId,
      records,
    });
    return data.data || data;
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/attendance/sessions/${id}`);
  },

  async justifyRecord(id: string, justification: string): Promise<any> {
    const { data } = await api.patch(`/attendance/records/${id}/justify`, {
      justification,
    });
    return data.data || data;
  },

  async getStudentStats(studentId: string, termId?: string): Promise<AttendanceStats> {
    const { data } = await api.get(`/attendance/stats/student/${studentId}`, {
      params: { termId },
    });
    return data.data || data;
  },

  async getClassStats(classId: string, termId?: string): Promise<AttendanceStats> {
    const { data } = await api.get(`/attendance/stats/class/${classId}`, {
      params: { termId },
    });
    return data.data || data;
  },

  async getTodayAbsences(): Promise<any[]> {
    const { data } = await api.get("/attendance/stats/today-absences");
    return data.data || data;
  },
};
