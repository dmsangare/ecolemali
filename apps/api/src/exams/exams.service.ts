import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ExamCreateDto,
  ExamUpdateDto,
  ExamSessionCreateDto,
  ExamGradesBulkDto,
} from "./dto";

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, filters: { academicYearId?: string; termId?: string; type?: string; status?: string } = {}) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.termId) where.termId = filters.termId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          term: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
          _count: { select: { sessions: true } },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        term: true,
        academicYear: true,
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          include: {
            subject: { select: { id: true, code: true, name: true } },
            class: { select: { id: true, code: true, name: true } },
            room: { select: { id: true, name: true } },
            supervisor: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { candidates: true } },
          },
        },
        _count: { select: { sessions: true } },
      },
    });
    if (!exam) throw new NotFoundException("Examen introuvable");
    return exam;
  }

  async create(dto: ExamCreateDto) {
    return this.prisma.exam.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        termId: dto.termId || null,
        status: "PLANNED",
      } as any,
    });
  }

  async update(id: string, dto: ExamUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.exam.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.exam.delete({ where: { id } });
  }

  // ============================================================
  // SESSIONS
  // ============================================================

  async createSession(dto: ExamSessionCreateDto) {
    await this.findOne(dto.examId);

    return this.prisma.examSession.create({
      data: {
        ...dto,
        roomId: dto.roomId || null,
        supervisorId: dto.supervisorId || null,
        date: new Date(dto.date),
        startTime: new Date(`1970-01-01T${dto.startTime}:00Z`),
        endTime: new Date(`1970-01-01T${dto.endTime}:00Z`),
      } as any,
      include: {
        subject: { select: { id: true, code: true, name: true } },
        class: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findSession(id: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id },
      include: {
        exam: true,
        subject: true,
        class: true,
        room: true,
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        candidates: {
          include: {
            student: {
              select: {
                id: true, matricule: true, firstName: true, lastName: true, gender: true,
              },
            },
          },
          orderBy: { student: { lastName: "asc" } },
        },
      },
    });
    if (!session) throw new NotFoundException("Session d examen introuvable");
    return session;
  }

  async removeSession(id: string) {
    await this.findSession(id);
    return this.prisma.examSession.delete({ where: { id } });
  }

  // ============================================================
  // CANDIDATS
  // ============================================================

  /**
   * Genere automatiquement la liste des candidats pour une session
   * a partir des eleves inscrits dans la classe.
   */
  async generateCandidates(sessionId: string) {
    const session = await this.findSession(sessionId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId: session.classId,
        academicYearId: session.exam.academicYearId,
        status: "VALIDATED",
      },
      select: { studentId: true },
    });

    if (enrollments.length === 0) {
      throw new BadRequestException("Aucun eleve inscrit dans cette classe");
    }

    // Creer les candidats manquants
    const created = await this.prisma.$transaction(
      enrollments.map((e) =>
        this.prisma.examCandidate.upsert({
          where: {
            examSessionId_studentId: {
              examSessionId: sessionId,
              studentId: e.studentId,
            },
          },
          update: {},
          create: {
            examSessionId: sessionId,
            studentId: e.studentId,
          },
        }),
      ),
    );

    return { created: created.length };
  }

  async getCandidates(sessionId: string) {
    await this.findSession(sessionId);
    return this.prisma.examCandidate.findMany({
      where: { examSessionId: sessionId },
      include: {
        student: {
          select: {
            id: true, matricule: true, firstName: true, lastName: true, gender: true,
          },
        },
      },
      orderBy: { student: { lastName: "asc" } },
    });
  }

  async enterGrades(sessionId: string, dto: ExamGradesBulkDto) {
    const session = await this.findSession(sessionId);

    const results = await this.prisma.$transaction(
      dto.candidates.map((c) =>
        this.prisma.examCandidate.upsert({
          where: {
            examSessionId_studentId: {
              examSessionId: sessionId,
              studentId: c.studentId,
            },
          },
          update: {
            isPresent: c.isPresent,
            score: c.score,
            observation: c.observation,
          },
          create: {
            examSessionId: sessionId,
            studentId: c.studentId,
            isPresent: c.isPresent,
            score: c.score,
            observation: c.observation,
          },
        }),
      ),
    );

    return { updated: results.length };
  }

  // ============================================================
  // RESULTATS / PV
  // ============================================================

  async getResults(examId: string) {
    const exam = await this.findOne(examId);

    // Pour chaque session, calculer la moyenne, min, max, taux de reussite
    const results = await Promise.all(
      exam.sessions.map(async (s) => {
        const candidates = await this.prisma.examCandidate.findMany({
          where: { examSessionId: s.id, score: { not: null } },
        });

        const scores = candidates.map((c) => Number(c.score));
        const present = candidates.filter((c) => c.isPresent !== false).length;
        const absent = candidates.length - present;
        const passed = scores.filter((v) => v >= 10).length;
        const failed = scores.filter((v) => v < 10).length;

        const average = scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null;

        return {
          session: s,
          stats: {
            total: candidates.length,
            present,
            absent,
            passed,
            failed,
            average,
            min: scores.length > 0 ? Math.min(...scores) : null,
            max: scores.length > 0 ? Math.max(...scores) : null,
            successRate: scores.length > 0 ? Math.round((passed / scores.length) * 100) : 0,
          },
        };
      }),
    );

    return { exam, results };
  }

  async getCandidatePv(sessionId: string) {
    const session = await this.findSession(sessionId);

    const sorted = [...session.candidates]
      .filter((c) => c.score !== null)
      .sort((a, b) => Number(b.score) - Number(a.score));

    return {
      session: {
        id: session.id,
        examName: session.exam.name,
        examType: session.exam.type,
        subject: session.subject,
        class: session.class,
        room: session.room,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      candidates: session.candidates.map((c) => ({
        ...c,
        rank: c.score !== null
          ? sorted.findIndex((x) => x.id === c.id) + 1
          : null,
      })),
    };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.exam.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
