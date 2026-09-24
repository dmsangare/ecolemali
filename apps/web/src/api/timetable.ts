import { api } from "@/lib/axios";

const unwrap = (res: any) => res.data?.data ?? res.data;

export const timetableApi = {
  list: async (params?: { classId?: string; academicYearId?: string; teacherId?: string }) => {
    const res = await api.get('/timetable-slots', { params });
    return unwrap(res);
  },
  getByClass: async (classId: string) => {
    const res = await api.get(`/timetable-slots/class/${classId}`);
    return unwrap(res);
  },
  getByTeacher: async (teacherId: string) => {
    const res = await api.get(`/timetable-slots/teacher/${teacherId}`);
    return unwrap(res);
  },
  create: async (dto: any) => {
    const res = await api.post('/timetable-slots', dto);
    return unwrap(res);
  },
  update: async (id: string, dto: any) => {
    const res = await api.patch(`/timetable-slots/${id}`, dto);
    return unwrap(res);
  },
  remove: async (id: string) => {
    const res = await api.delete(`/timetable-slots/${id}`);
    return unwrap(res);
  },
  checkConflicts: async (dto: any) => {
    const res = await api.post('/timetable-slots/check-conflicts', dto);
    return unwrap(res);
  },
};
