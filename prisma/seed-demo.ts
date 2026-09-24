/**
 * SIS-MALI — Seed enrichi avec donnees de demonstration
 * Emploi du temps, evaluations, notes, bulletins, factures, paiements, presences, examens
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SIS-MALI DEMO seed...\n');

  // 1. Recuperer l'ecole demo
  const school = await prisma.school.findFirst({ where: { code: 'DEMO-BAMAKO' } });
  if (!school) throw new Error('Ecole demo introuvable');

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId: school.id, isCurrent: true },
  });
  if (!academicYear) throw new Error('Annee scolaire active introuvable');

  const terms = await prisma.term.findMany({
    where: { academicYearId: academicYear.id },
    orderBy: { orderIndex: 'asc' },
  });
  if (terms.length === 0) throw new Error('Aucun trimestre');

  const classes = await prisma.class.findMany({
    where: { academicYearId: academicYear.id },
    include: { level: true, _count: { select: { enrollments: true } } },
  });

  const subjects = await prisma.subject.findMany({ where: { schoolId: school.id } });
  const teachers = await prisma.teacher.findMany({ where: { schoolId: school.id } });
  const rooms = await prisma.room.findMany({ where: { schoolId: school.id } });
  const feeTypes = await prisma.feeType.findMany({ where: { schoolId: school.id } });

  console.log(`📚 ${classes.length} classes, ${subjects.length} matieres, ${teachers.length} enseignants`);

  // ============================================================
  // 2. EMPLOI DU TEMPS
  // ============================================================
  console.log('\n📅 Creating timetable slots...');

  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:15', end: '11:15' },
    { start: '11:15', end: '12:15' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
  ];

  let timetableCount = 0;
  for (const cls of classes) {
    for (let day = 1; day <= 5; day++) {
      // 4 cours par jour
      for (let slot = 0; slot < 4; slot++) {
        const subject = subjects[(day + slot + cls.code.length) % subjects.length];
        const teacher = teachers[(day + slot) % teachers.length];
        const room = rooms[(day + slot) % rooms.length];
        const time = timeSlots[slot];

        try {
          await prisma.timetableSlot.create({
            data: {
              schoolId: school.id,
              academicYearId: academicYear.id,
              classId: cls.id,
              subjectId: subject.id,
              teacherId: teacher.id,
              roomId: room.id,
              dayOfWeek: day,
              startTime: new Date(`1970-01-01T${time.start}:00Z`),
              endTime: new Date(`1970-01-01T${time.end}:00Z`),
              weekPattern: 0,
            },
          });
          timetableCount++;
        } catch (e) {
          // Ignore les conflits
        }
      }
    }
  }
  console.log(`   ✅ ${timetableCount} creneaux crees`);

  // ============================================================
  // 3. EVALUATIONS + NOTES
  // ============================================================
  console.log('\n📝 Creating assessments and grades...');

  let assessmentCount = 0;
  let gradeCount = 0;

  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id, status: 'VALIDATED' },
      select: { studentId: true },
    });

    for (const subject of subjects.slice(0, 6)) {
      const teacher = teachers[subjects.indexOf(subject) % teachers.length];
      const term = terms[0];

      const assessment = await prisma.assessment.create({
        data: {
          schoolId: school.id,
          academicYearId: academicYear.id,
          termId: term.id,
          classId: cls.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          type: 'DEVOIR',
          title: `Devoir ${subject.code} - ${cls.code}`,
          date: new Date(),
          maxScore: 20,
          coefficient: 1,
          status: 'VALIDATED',
        },
      });
      assessmentCount++;

      for (const enr of enrollments) {
        const value = Math.round((Math.random() * 12 + 8) * 10) / 10; // 8-20
        await prisma.grade.create({
          data: {
            assessmentId: assessment.id,
            studentId: enr.studentId,
            value,
            isAbsent: false,
            locked: true,
          },
        });
        gradeCount++;
      }
    }
  }
  console.log(`   ✅ ${assessmentCount} evaluations, ${gradeCount} notes`);

  // ============================================================
  // 4. PRESENCES
  // ============================================================
  console.log('\n📋 Creating attendance sessions...');

  let sessionCount = 0;
  let recordCount = 0;

  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id, status: 'VALIDATED' },
      select: { studentId: true },
    });

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const teacher = teachers[i % teachers.length];

      try {
        const session = await prisma.attendanceSession.create({
          data: {
            classId: cls.id,
            teacherId: teacher.id,
            termId: terms[0].id,
            date,
            startTime: new Date('1970-01-01T08:00:00Z'),
            endTime: new Date('1970-01-01T09:00:00Z'),
          },
        });
        sessionCount++;

        for (const enr of enrollments) {
          const rand = Math.random();
          let status: any = 'PRESENT';
          if (rand < 0.05) status = 'ABSENT';
          else if (rand < 0.1) status = 'LATE';

          await prisma.attendanceRecord.create({
            data: {
              sessionId: session.id,
              studentId: enr.studentId,
              status,
            },
          });
          recordCount++;
        }
      } catch (e) {
        // Ignore les doublons
      }
    }
  }
  console.log(`   ✅ ${sessionCount} sessions, ${recordCount} enregistrements`);

  // ============================================================
  // 5. FACTURES + PAIEMENTS
  // ============================================================
  console.log('\n💰 Creating invoices and payments...');

  const allEnrollments = await prisma.enrollment.findMany({
    where: { academicYearId: academicYear.id, status: 'VALIDATED' },
    take: 20,
  });

  let invoiceCount = 0;
  let paymentCount = 0;

  for (let i = 0; i < allEnrollments.length; i++) {
    const enr = allEnrollments[i];
    const total = 250000; // 250 000 FCFA
    const paidAmount = i < 15 ? Math.floor(total * (0.3 + Math.random() * 0.7)) : 0;
    const balance = total - paidAmount;

    let status: any = 'UNPAID';
    if (balance === 0) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';

    const invoice = await prisma.invoice.create({
      data: {
        schoolId: school.id,
        studentId: enr.studentId,
        academicYearId: academicYear.id,
        number: `FAC-2026-${String(i + 1).padStart(6, '0')}`,
        issuedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        totalAmount: total,
        paidAmount,
        balance: Math.max(balance, 0),
        status,
      },
    });
    invoiceCount++;

    if (paidAmount > 0) {
      const cashier = await prisma.user.findFirst({
        where: { email: 'accountant@sis-mali.local' },
      });

      const payment = await prisma.payment.create({
        data: {
          schoolId: school.id,
          invoiceId: invoice.id,
          studentId: enr.studentId,
          amount: paidAmount,
          method: 'CASH',
          paidAt: new Date(),
          cashierId: cashier?.id,
        },
      });
      paymentCount++;

      await prisma.receipt.create({
        data: {
          paymentId: payment.id,
          number: `REC-2026-${String(paymentCount).padStart(6, '0')}`,
        },
      });
    }
  }
  console.log(`   ✅ ${invoiceCount} factures, ${paymentCount} paiements`);

  // ============================================================
  // 6. EXAMENS
  // ============================================================
  console.log('\n🎓 Creating exams...');

  let examCount = 0;
  for (const cls of classes) {
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        termId: terms[0].id,
        type: 'COMPOSITION',
        name: `Composition 1er Trimestre - ${cls.name}`,
        startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        status: 'PLANNED',
      },
    });
    examCount++;
  }
  console.log(`   ✅ ${examCount} examens`);

  console.log('\n✅ Demo seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
