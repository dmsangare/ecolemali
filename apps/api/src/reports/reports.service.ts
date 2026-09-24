import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(schoolId: string, _academicYearId?: string) {
    const studentsCount = await this.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } });
    const teachersCount = await this.prisma.teacher.count({ where: { schoolId, status: 'ACTIVE' } });
    const classesCount = await this.prisma.class.count({ where: { schoolId } });

    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, paidAmount: true, balance: true },
    });
    const payments = await this.prisma.payment.findMany({
      where: { schoolId, cancelledAt: null },
      select: { amount: true },
    });

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const revenueAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
    const unpaidAmount = invoices.reduce((s, i) => s + Number(i.balance), 0);

    const boys = await this.prisma.student.count({ where: { schoolId, gender: 'M', status: 'ACTIVE' } });
    const girls = await this.prisma.student.count({ where: { schoolId, gender: 'F', status: 'ACTIVE' } });

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { class: { schoolId } },
      include: { records: { select: { status: true } } },
    });
    let totalRecords = 0;
    let presentRecords = 0;
    for (const s of sessions) {
      totalRecords += s.records.length;
      presentRecords += s.records.filter((r) => r.status === 'PRESENT').length;
    }
    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    return {
      data: {
        studentsCount, teachersCount, classesCount,
        attendanceRate: Math.round(attendanceRate),
        unpaidAmount, revenueAmount, totalBilled,
        genderSplit: { boys, girls },
      },
    };
  }

  async getFinancial(schoolId: string, _academicYearId?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: { not: 'CANCELLED' } },
      include: { items: { select: { totalAmount: true, feeType: { select: { category: true } } } } },
    });
    const payments = await this.prisma.payment.findMany({
      where: { schoolId, cancelledAt: null },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { paidAt: 'desc' },
    });

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalUnpaid = invoices.reduce((s, i) => s + Number(i.balance), 0);

    const byCategory: Record<string, number> = {};
    for (const inv of invoices) {
      for (const item of inv.items) {
        const cat = item.feeType?.category ?? 'AUTRE';
        byCategory[cat] = (byCategory[cat] ?? 0) + Number(item.totalAmount);
      }
    }

    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const p of payments) {
      const m = p.method ?? 'AUTRE';
      if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
      byMethod[m].count++;
      byMethod[m].total += Number(p.amount);
    }

    const byMonth: Record<string, number> = {};
    for (const p of payments) {
      const m = new Date(p.paidAt).toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount);
    }

    return {
      data: {
        totalBilled, totalPaid, totalUnpaid,
        invoicesCount: invoices.length,
        paidInvoices: invoices.filter((i) => i.status === 'PAID').length,
        partialInvoices: invoices.filter((i) => i.status === 'PARTIAL').length,
        unpaidInvoices: invoices.filter((i) => i.status === 'UNPAID').length,
        overdueInvoices: invoices.filter((i) => i.status === 'OVERDUE').length,
        recoveryRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0,
        byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
        byMethod: Object.entries(byMethod).map(([method, v]) => ({ method, ...v })),
        byMonth: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([month, amount]) => ({ month, amount })),
        paymentsCount: payments.length,
        topPayments: payments.slice(0, 10).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          paidAt: p.paidAt,
          studentName: `${p.student.firstName} ${p.student.lastName}`,
        })),
      },
    };
  }

  async getUnpaid(schoolId: string, classId?: string) {
    // 1. Factures impayées
    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] }, balance: { gt: 0 } },
      orderBy: { balance: 'desc' },
    });

    // 2. Élèves
    const studentIds = [...new Set(invoices.map((i) => i.studentId))];
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, matricule: true, firstName: true, lastName: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    // 3. Classes via Enrollment (VALIDATED = active)
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        status: 'VALIDATED',
      },
      select: { studentId: true, classId: true },
    });
    const classIds = [...new Set(enrollments.map((e) => e.classId))];
    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true },
    });
    const classMap = new Map(classes.map((c) => [c.id, c]));
    const studentClassMap = new Map(enrollments.map((e) => [e.studentId, e.classId]));

    // 4. Filtre par classe
    const filtered = classId
      ? invoices.filter((i) => studentClassMap.get(i.studentId) === classId)
      : invoices;

    // 5. Regrouper par classe
    const byClassMap: Record<string, { className: string; count: number; total: number }> = {};
    for (const inv of filtered) {
      const cid = studentClassMap.get(inv.studentId);
      const cls = cid ? classMap.get(cid) : null;
      const key = cls?.id ?? 'none';
      if (!byClassMap[key]) {
        byClassMap[key] = { className: cls?.name ?? 'Non affecté', count: 0, total: 0 };
      }
      byClassMap[key].count++;
      byClassMap[key].total += Number(inv.balance);
    }

    return {
      data: {
        totalOutstanding: filtered.reduce((s, i) => s + Number(i.balance), 0),
        count: filtered.length,
        byClass: Object.values(byClassMap).sort((a, b) => b.total - a.total),
        items: filtered.map((i) => {
          const st: any = studentMap.get(i.studentId);
          const cid = studentClassMap.get(i.studentId);
          const cls: any = cid ? classMap.get(cid) : null;
          return {
            id: i.id,
            number: i.number,
            studentName: st ? `${st.firstName} ${st.lastName}` : '—',
            matricule: st?.matricule ?? '—',
            className: cls?.name ?? '—',
            totalAmount: Number(i.totalAmount),
            paidAmount: Number(i.paidAmount),
            balance: Number(i.balance),
            dueDate: i.dueDate,
            status: i.status,
          };
        }),
      },
    };
  }

  async getStudents(schoolId: string, _academicYearId?: string) {
    // 1. Classes de l'école
    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true, levelId: true },
    });
    const classMap = new Map(classes.map((c) => [c.id, c]));
    const classIds = classes.map((c) => c.id);

    // 2. Niveaux
    const levels = await this.prisma.level.findMany({
      where: { schoolId },
      select: { id: true, name: true, code: true, cycle: true },
    });
    const levelMap = new Map(levels.map((l) => [l.id, l]));

    // 3. Inscriptions
    const enrollments = await this.prisma.enrollment.findMany({
      where: { status: 'VALIDATED', classId: { in: classIds } },
      select: { id: true, studentId: true, classId: true, levelId: true },
    });

    // 4. Élèves
    const studentIds = enrollments.map((e) => e.studentId);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, gender: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const byLevelMap: Record<string, any> = {};
    const byClassMap: Record<string, any> = {};
    let boys = 0, girls = 0;

    for (const e of enrollments) {
      const cls: any = classMap.get(e.classId);
      const level: any = levelMap.get(e.levelId);
      const st: any = studentMap.get(e.studentId);
      if (!st) continue;

      const isBoy = st.gender === 'M';
      if (isBoy) boys++; else girls++;

      const lkey = e.levelId;
      if (!byLevelMap[lkey]) {
        byLevelMap[lkey] = { code: level?.code ?? '—', name: level?.name ?? '—', cycle: level?.cycle ?? '—', count: 0, boys: 0, girls: 0 };
      }
      byLevelMap[lkey].count++;
      if (isBoy) byLevelMap[lkey].boys++; else byLevelMap[lkey].girls++;

      const ckey = e.classId;
      if (!byClassMap[ckey]) {
        byClassMap[ckey] = { className: cls?.name ?? '—', levelName: level?.name ?? '—', cycle: level?.cycle ?? '—', count: 0, boys: 0, girls: 0 };
      }
      byClassMap[ckey].count++;
      if (isBoy) byClassMap[ckey].boys++; else byClassMap[ckey].girls++;
    }

    return {
      data: {
        total: enrollments.length,
        boys,
        girls,
        byLevel: Object.values(byLevelMap).sort((a: any, b: any) => a.name.localeCompare(b.name)),
        byClass: Object.values(byClassMap).sort((a: any, b: any) => a.className.localeCompare(b.className)),
      },
    };
  }

  async getPedagogicalStats(schoolId: string, termId?: string) {
    const where: any = { assessment: { schoolId } };
    if (termId) where.assessment.termId = termId;

    const grades = await this.prisma.grade.findMany({
      where: { ...where, value: { not: null }, isAbsent: false },
      include: {
        assessment: {
          select: {
            maxScore: true,
            subject: { select: { id: true, code: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    const bySubjectMap: Record<string, any> = {};
    const byClassMap: Record<string, any> = {};

    for (const g of grades) {
      const max = Number(g.assessment.maxScore) || 20;
      const pct = (Number(g.value) / max) * 100;
      const subj = g.assessment.subject;
      const cls = g.assessment.class;

      if (subj) {
        if (!bySubjectMap[subj.id]) {
          bySubjectMap[subj.id] = { code: subj.code, subject: subj.name, count: 0, sumPct: 0, avgPct: 0, minPct: 100, maxPct: 0 };
        }
        bySubjectMap[subj.id].count++;
        bySubjectMap[subj.id].sumPct += pct;
        if (pct < bySubjectMap[subj.id].minPct) bySubjectMap[subj.id].minPct = pct;
        if (pct > bySubjectMap[subj.id].maxPct) bySubjectMap[subj.id].maxPct = pct;
      }

      if (cls) {
        if (!byClassMap[cls.id]) byClassMap[cls.id] = { className: cls.name, count: 0, sumPct: 0, avgPct: 0 };
        byClassMap[cls.id].count++;
        byClassMap[cls.id].sumPct += pct;
      }
    }

    Object.values(bySubjectMap).forEach((s: any) => { s.avgPct = s.count ? s.sumPct / s.count : 0; });
    Object.values(byClassMap).forEach((c: any) => { c.avgPct = c.count ? c.sumPct / c.count : 0; });

    const successCount = grades.filter((g) => {
      const max = Number(g.assessment.maxScore) || 20;
      return (Number(g.value) / max) * 100 >= 50;
    }).length;

    return {
      data: {
        totalGrades: grades.length,
        successRate: grades.length > 0 ? (successCount / grades.length) * 100 : 0,
        bySubject: Object.values(bySubjectMap).sort((a: any, b: any) => b.avgPct - a.avgPct).map((s: any) => ({
          code: s.code, subject: s.subject, count: s.count,
          avgPct: Math.round(s.avgPct * 10) / 10,
          minPct: Math.round(s.minPct * 10) / 10,
          maxPct: Math.round(s.maxPct * 10) / 10,
        })),
        byClass: Object.values(byClassMap).sort((a: any, b: any) => a.className.localeCompare(b.className)).map((c: any) => ({
          className: c.className, count: c.count, avgPct: Math.round(c.avgPct * 10) / 10,
        })),
      },
    };
  }

  async getAttendance(schoolId: string, classId?: string, termId?: string) {
    const where: any = { class: { schoolId } };
    if (classId) where.classId = classId;
    if (termId) where.termId = termId;

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        records: { select: { status: true } },
      },
    });

    const byClassMap: Record<string, any> = {};
    let totalRecords = 0, present = 0, absent = 0, absentJustified = 0, late = 0;

    for (const s of sessions) {
      const cls = s.class;
      if (!byClassMap[cls.id]) {
        byClassMap[cls.id] = { className: cls.name, sessionsCount: 0, total: 0, present: 0, absent: 0, late: 0 };
      }
      byClassMap[cls.id].sessionsCount++;

      for (const r of s.records) {
        totalRecords++;
        byClassMap[cls.id].total++;
        if (r.status === 'PRESENT') { present++; byClassMap[cls.id].present++; }
        else if (r.status === 'LATE') { late++; byClassMap[cls.id].late++; }
        else if (r.status === 'ABSENT_JUSTIFIED') { absentJustified++; byClassMap[cls.id].absent++; }
        else { absent++; byClassMap[cls.id].absent++; }
      }
    }

    Object.values(byClassMap).forEach((c: any) => {
      c.presenceRate = c.total > 0 ? Math.round((c.present / c.total) * 1000) / 10 : 0;
    });

    return {
      data: {
        sessionsCount: sessions.length, total: totalRecords, present,
        absent: absent + absentJustified, absentJustified, late,
        presenceRate: totalRecords > 0 ? Math.round((present / totalRecords) * 1000) / 10 : 0,
        absenceRate: totalRecords > 0 ? Math.round(((absent + absentJustified) / totalRecords) * 1000) / 10 : 0,
        byClass: Object.values(byClassMap).sort((a: any, b: any) => a.className.localeCompare(b.className)),
      },
    };
  }

  async getClassesComparison(schoolId: string) {
    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      include: {
        level: { select: { name: true, cycle: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: classes.map((c) => ({
        id: c.id, name: c.name,
        levelName: c.level?.name ?? '—',
        cycle: c.level?.cycle ?? '—',
        studentsCount: c._count.enrollments,
      })),
    };
  }

  async getMonthlyEvolution(schoolId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { schoolId, cancelledAt: null },
      select: { amount: true, paidAt: true },
    });

    const byMonth: Record<string, { revenue: number; count: number }> = {};
    for (const p of payments) {
      const m = new Date(p.paidAt).toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { revenue: 0, count: 0 };
      byMonth[m].revenue += Number(p.amount);
      byMonth[m].count++;
    }

    return {
      data: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, ...v })),
    };
  }
}
