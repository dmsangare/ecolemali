import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // DASHBOARD DIRECTION
  // ============================================================

  async getDashboard(schoolId: string, academicYearId?: string) {
    const currentYear = academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });

    const yearId = currentYear?.id;

    const [
      studentsCount,
      teachersCount,
      classesCount,
      invoices,
      attendanceStats,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { schoolId, deletedAt: null, status: "ACTIVE" },
      }),
      this.prisma.teacher.count({
        where: { schoolId, status: "ACTIVE" },
      }),
      this.prisma.class.count({
        where: { schoolId, ...(yearId ? { academicYearId: yearId } : {}) },
      }),
      this.prisma.invoice.findMany({
        where: { schoolId, ...(yearId ? { academicYearId: yearId } : {}), status: { not: "CANCELLED" } },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          session: {
            ...(yearId ? { term: { academicYearId: yearId } } : {}),
            class: { schoolId },
          },
        },
      }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    const totalUnpaid = invoices.reduce((s, i) => s + Number(i.balance), 0);

    const present = attendanceStats.filter((a) => a.status === "PRESENT").length;
    const totalAttendance = attendanceStats.length;
    const attendanceRate = totalAttendance > 0
      ? Math.round((present / totalAttendance) * 100)
      : 100;

    // Repartition garcons/filles
    const boysCount = await this.prisma.student.count({
      where: { schoolId, deletedAt: null, gender: "M", status: "ACTIVE" },
    });
    const girlsCount = studentsCount - boysCount;

    return {
      studentsCount,
      teachersCount,
      classesCount,
      attendanceRate,
      unpaidAmount: totalUnpaid,
      revenueAmount: totalPaid,
      totalBilled,
      genderSplit: { boys: boysCount, girls: girlsCount },
    };
  }

  // ============================================================
  // STATISTIQUES ELEVES
  // ============================================================

  async getStudentStats(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId, deletedAt: null };
    if (academicYearId) {
      where.enrollments = { some: { academicYearId, status: "VALIDATED" } };
    }

    const students = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        gender: true,
        birthDate: true,
        enrollments: {
          where: { status: "VALIDATED" },
          take: 1,
          orderBy: { enrollmentDate: "desc" },
          include: {
            level: { select: { id: true, code: true, name: true } },
            class: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    const total = students.length;
    const boys = students.filter((s) => s.gender === "M").length;
    const girls = total - boys;

    // Repartition par niveau
    const byLevelMap = new Map<string, { code: string; name: string; count: number }>();
    for (const s of students) {
      const level = s.enrollments[0]?.level;
      if (!level) continue;
      const key = level.id;
      if (!byLevelMap.has(key)) {
        byLevelMap.set(key, { code: level.code, name: level.name, count: 0 });
      }
      byLevelMap.get(key)!.count += 1;
    }

    // Repartition par classe
    const byClassMap = new Map<string, { code: string; name: string; count: number }>();
    for (const s of students) {
      const cls = s.enrollments[0]?.class;
      if (!cls) continue;
      const key = cls.id;
      if (!byClassMap.has(key)) {
        byClassMap.set(key, { code: cls.code, name: cls.name, count: 0 });
      }
      byClassMap.get(key)!.count += 1;
    }

    // Repartition par age
    const today = new Date();
    const byAge: Record<string, number> = {};
    for (const s of students) {
      const age = today.getFullYear() - new Date(s.birthDate).getFullYear();
      const bucket = `${age} ans`;
      byAge[bucket] = (byAge[bucket] || 0) + 1;
    }

    return {
      total,
      boys,
      girls,
      byLevel: Array.from(byLevelMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
      byClass: Array.from(byClassMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
      byAge,
    };
  }

  // ============================================================
  // STATISTIQUES PEDAGOGIQUES
  // ============================================================

  async getPedagogicalStats(schoolId: string, termId?: string) {
    const where: any = { schoolId };
    if (termId) where.termId = termId;

    const reports = await this.prisma.reportCard.findMany({
      where,
      include: {
        student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        class: { select: { id: true, code: true, name: true } },
        items: { include: { subject: { select: { id: true, code: true, name: true } } } },
      },
    });

    if (reports.length === 0) {
      return {
        globalAverage: null,
        successRate: 0,
        failureRate: 0,
        totalStudents: 0,
        bySubject: [],
        byClass: [],
        topStudents: [],
      };
    }

    const averages = reports.map((r) => Number(r.average)).filter((v) => !isNaN(v));
    const globalAverage = averages.length > 0
      ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100
      : null;

    const passed = averages.filter((v) => v >= 10).length;
    const failed = averages.filter((v) => v < 10).length;
    const total = averages.length;

    // Stats par matiere
    const subjectMap = new Map<string, { code: string; name: string; sum: number; count: number }>();
    for (const r of reports) {
      for (const item of r.items) {
        if (item.average === null) continue;
        const key = item.subject.id;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            code: item.subject.code,
            name: item.subject.name,
            sum: 0,
            count: 0,
          });
        }
        const entry = subjectMap.get(key)!;
        entry.sum += Number(item.average);
        entry.count += 1;
      }
    }

    const bySubject = Array.from(subjectMap.values()).map((s) => ({
      code: s.code,
      name: s.name,
      average: Math.round((s.sum / s.count) * 100) / 100,
      studentsCount: s.count,
    }));

    // Stats par classe
    const classMap = new Map<string, { code: string; name: string; sum: number; count: number }>();
    for (const r of reports) {
      if (r.average === null) continue;
      const key = r.class.id;
      if (!classMap.has(key)) {
        classMap.set(key, { code: r.class.code, name: r.class.name, sum: 0, count: 0 });
      }
      const entry = classMap.get(key)!;
      entry.sum += Number(r.average);
      entry.count += 1;
    }

    const byClass = Array.from(classMap.values()).map((c) => ({
      code: c.code,
      name: c.name,
      average: Math.round((c.sum / c.count) * 100) / 100,
      studentsCount: c.count,
    }));

    // Top 10 eleves
    const topStudents = [...reports]
      .filter((r) => r.average !== null)
      .sort((a, b) => Number(b.average) - Number(a.average))
      .slice(0, 10)
      .map((r) => ({
        studentId: r.student.id,
        matricule: r.student.matricule,
        firstName: r.student.firstName,
        lastName: r.student.lastName,
        className: r.class.name,
        average: Number(r.average),
        rank: r.rank,
      }));

    return {
      globalAverage,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      totalStudents: total,
      passed,
      failed,
      bySubject: bySubject.sort((a, b) => b.average - a.average),
      byClass: byClass.sort((a, b) => b.average - a.average),
      topStudents,
    };
  }

  // ============================================================
  // STATISTIQUES FINANCIERES
  // ============================================================

  async getFinancialStats(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { ...where, status: { not: "CANCELLED" } },
        include: { items: { include: { feeType: true } } },
      }),
      this.prisma.payment.findMany({
        where: { schoolId, cancelledAt: null, ...(academicYearId ? { invoice: { academicYearId } } : {}) },
      }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalUnpaid = invoices.reduce((s, i) => s + Number(i.balance), 0);

    // Repartition par categorie de frais
    const byCategoryMap = new Map<string, number>();
    for (const i of invoices) {
      for (const item of i.items) {
        const cat = item.feeType.category;
        byCategoryMap.set(cat, (byCategoryMap.get(cat) || 0) + Number(item.totalAmount));
      }
    }

    // Repartition par mois
    const byMonthMap = new Map<string, number>();
    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap.set(key, (byMonthMap.get(key) || 0) + Number(p.amount));
    }

    return {
      totalBilled,
      totalPaid,
      totalUnpaid,
      invoicesCount: invoices.length,
      paidInvoices: invoices.filter((i) => i.status === "PAID").length,
      partialInvoices: invoices.filter((i) => i.status === "PARTIAL").length,
      unpaidInvoices: invoices.filter((i) => i.status === "UNPAID").length,
      overdueInvoices: invoices.filter((i) => i.status === "OVERDUE").length,
      byCategory: Array.from(byCategoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  // ============================================================
  // STATISTIQUES PRESENCES
  // ============================================================

  async getAttendanceStats(schoolId: string, classId?: string, termId?: string) {
    const where: any = { class: { schoolId } };
    if (classId) where.classId = classId;
    if (termId) where.termId = termId;

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: { records: true, class: { select: { id: true, code: true, name: true } } },
    });

    const allRecords = sessions.flatMap((s) => s.records);
    const total = allRecords.length;
    const present = allRecords.filter((r) => r.status === "PRESENT").length;
    const absent = allRecords.filter((r) => r.status === "ABSENT" || r.status === "ABSENT_UNJUSTIFIED").length;
    const absentJustified = allRecords.filter((r) => r.status === "ABSENT_JUSTIFIED").length;
    const late = allRecords.filter((r) => r.status === "LATE").length;

    return {
      sessionsCount: sessions.length,
      total,
      present,
      absent,
      absentJustified,
      late,
      presenceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
      absenceRate: total > 0 ? Math.round(((absent + absentJustified) / total) * 100) : 0,
    };
  }
}
