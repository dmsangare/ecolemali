/**
 * SIS-MALI — Database Seed
 * Roles, permissions, RBAC matrix, demo school, Mali levels,
 * standard subjects, fee structures, demo users and students.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// ============================================================
// PERMISSION MATRIX
// ============================================================

const MODULES = [
  'school',
  'academic_year',
  'level',
  'class',
  'student',
  'parent',
  'enrollment',
  'teacher',
  'subject',
  'assignment',
  'timetable',
  'attendance',
  'assessment',
  'grade',
  'report_card',
  'exam',
  'fee',
  'invoice',
  'payment',
  'cash',
  'document',
  'notification',
  'report',
  'user',
  'role',
  'audit',
  'backup',
  'settings',
] as const;

const ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'validate',
  'export',
  'print',
  'lock',
  'close',
  'archive',
  'restore',
] as const;

const ROLE_MATRIX: Record<string, { modules: string[]; actions: string[] } | 'all'> = {
  SUPER_ADMIN: 'all',
  DIRECTOR: {
    modules: MODULES.filter((m) => m !== 'backup'),
    actions: [...ACTIONS],
  },
  SECRETARY: {
    modules: ['student', 'parent', 'enrollment', 'document'],
    actions: ['view', 'create', 'update', 'export', 'print'],
  },
  TEACHER: {
    modules: ['student', 'assessment', 'grade', 'attendance', 'report_card', 'school', 'level', 'class', 'subject', 'timetable'],
    actions: ['view', 'create', 'update'],
  },
  ACCOUNTANT: {
    modules: ['fee', 'invoice', 'payment', 'cash', 'report'],
    actions: ['view', 'create', 'update', 'validate', 'export', 'print', 'close'],
  },
  SUPERVISOR: {
    modules: ['student', 'attendance'],
    actions: ['view', 'create'],
  },
  PARENT: {
    modules: ['student', 'grade', 'report_card', 'attendance', 'invoice', 'payment'],
    actions: ['view', 'print'],
  },
  STUDENT: {
    modules: ['grade', 'report_card', 'attendance'],
    actions: ['view'],
  },
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  DIRECTOR: 'Direction',
  SECRETARY: 'Secrétariat',
  TEACHER: 'Enseignant',
  ACCOUNTANT: 'Comptable / Caissier',
  SUPERVISOR: 'Surveillant',
  PARENT: 'Parent / Tuteur',
  STUDENT: 'Élève',
};

// ============================================================
// MALI LEVELS
// ============================================================

const MALI_LEVELS = [
  { cycle: 'PREMIER_CYCLE', name: '1ère Année', code: '1ERE', orderIndex: 1 },
  { cycle: 'PREMIER_CYCLE', name: '2ème Année', code: '2EME', orderIndex: 2 },
  { cycle: 'PREMIER_CYCLE', name: '3ème Année', code: '3EME', orderIndex: 3 },
  { cycle: 'PREMIER_CYCLE', name: '4ème Année', code: '4EME', orderIndex: 4 },
  { cycle: 'PREMIER_CYCLE', name: '5ème Année', code: '5EME', orderIndex: 5 },
  { cycle: 'PREMIER_CYCLE', name: '6ème Année', code: '6EME', orderIndex: 6 },
  { cycle: 'DEUXIEME_CYCLE', name: '7ème Année', code: '7EME', orderIndex: 7 },
  { cycle: 'DEUXIEME_CYCLE', name: '8ème Année', code: '8EME', orderIndex: 8 },
  { cycle: 'DEUXIEME_CYCLE', name: '9ème Année (DEF)', code: '9EME', orderIndex: 9 },
  { cycle: 'LYCEE', name: '10ème Année', code: '10EME', orderIndex: 10 },
  { cycle: 'LYCEE', name: '11ème Année', code: '11EME', orderIndex: 11 },
  { cycle: 'LYCEE', name: '12ème Année (BAC)', code: '12EME', orderIndex: 12 },
] as const;

// ============================================================
// STANDARD SUBJECTS WITH COEFFICIENTS
// ============================================================

const STANDARD_SUBJECTS = [
  { code: 'MATH', name: 'Mathématiques', type: 'CORE', coefficient: 4 },
  { code: 'FR', name: 'Français', type: 'CORE', coefficient: 4 },
  { code: 'ANG', name: 'Anglais', type: 'CORE', coefficient: 2 },
  { code: 'PC', name: 'Physique-Chimie', type: 'CORE', coefficient: 3 },
  { code: 'HG', name: 'Histoire-Géographie', type: 'CORE', coefficient: 2 },
  { code: 'SVT', name: 'Sciences de la Vie et de la Terre', type: 'CORE', coefficient: 2 },
  { code: 'ECM', name: 'Éducation Civique et Morale', type: 'CORE', coefficient: 1 },
  { code: 'EPS', name: 'Éducation Physique et Sportive', type: 'SPORT', coefficient: 1 },
  { code: 'ART', name: 'Arts Plastiques', type: 'ART', coefficient: 1 },
] as const;

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log('🌱 Starting SIS-MALI seed...\n');

  // --- 1. Roles ---
  console.log('📋 Creating roles...');
  const roles: Record<string, { id: string }> = {};
  for (const code of Object.keys(ROLE_LABELS)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: ROLE_LABELS[code] },
      create: {
        code,
        name: ROLE_LABELS[code],
        description: `Rôle système : ${ROLE_LABELS[code]}`,
        isSystem: true,
      },
    });
    roles[code] = role;
  }

  // --- 2. Permissions ---
  console.log('🔐 Creating permissions...');
  const permissions: Record<string, { id: string }> = {};
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const code = `${module}:${action}`;
      const perm = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: {
          code,
          module,
          action,
          description: `${action} sur ${module}`,
        },
      });
      permissions[code] = perm;
    }
  }

  // --- 3. Role-Permission matrix ---
  console.log('🔗 Linking roles to permissions...');
  for (const [roleCode, config] of Object.entries(ROLE_MATRIX)) {
    const roleId = roles[roleCode].id;
    const targetModules = config === 'all' ? MODULES : config.modules;
    const targetActions = config === 'all' ? ACTIONS : config.actions;

    for (const module of targetModules) {
      for (const action of targetActions) {
        const permCode = `${module}:${action}`;
        if (!permissions[permCode]) continue;
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId: permissions[permCode].id,
            },
          },
          update: {},
          create: { roleId, permissionId: permissions[permCode].id },
        });
      }
    }
  }

  // --- 4. Demo School ---
  console.log('🏫 Creating demo school...');
  const school = await prisma.school.upsert({
    where: { code: 'DEMO-BAMAKO' },
    update: {},
    create: {
      code: 'DEMO-BAMAKO',
      name: 'Complexe Scolaire Les Aiglons de Bamako',
      type: 'FONDAMENTAL_LYCEE',
      status: 'PRIVE',
      address: 'Hamdallaye ACI 2000, Rue 405',
      region: 'Bamako',
      cercle: 'Bamako',
      commune: 'Commune IV',
      quarter: 'Hamdallaye',
      phone: '+223 20 22 33 44',
      email: 'contact@aiglons-bamako.ml',
      directorName: 'M. Ibrahim KEITA',
      motto: 'Discipline — Travail — Réussite',
      createdYear: 2010,
      isActive: true,
    },
  });

  // --- 5. Settings ---
  await prisma.setting.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      currency: 'FCFA',
      locale: 'fr-FR',
      timezone: 'Africa/Bamako',
      gradingScale: 20,
      passMark: 10,
    },
  });

  // --- 6. Academic Year 2026-2027 ---
  console.log('📅 Creating academic year...');
  const academicYear = await prisma.academicYear.upsert({
    where: {
      schoolId_label: {
        schoolId: school.id,
        label: '2026-2027',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      label: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      status: 'ACTIVE',
      isCurrent: true,
    },
  });

  // --- 7. Terms ---
  console.log('📆 Creating terms...');
  const termsData = [
    { name: '1er Trimestre', orderIndex: 1, start: '2026-09-01', end: '2026-12-20' },
    { name: '2ème Trimestre', orderIndex: 2, start: '2027-01-05', end: '2027-03-31' },
    { name: '3ème Trimestre', orderIndex: 3, start: '2027-04-01', end: '2027-06-30' },
  ];

  const terms: { id: string }[] = [];
  for (const t of termsData) {
    const existing = await prisma.term.findFirst({
      where: { academicYearId: academicYear.id, orderIndex: t.orderIndex },
    });
    const term = existing
      ? existing
      : await prisma.term.create({
          data: {
            academicYearId: academicYear.id,
            name: t.name,
            type: 'TRIMESTRE',
            startDate: new Date(t.start),
            endDate: new Date(t.end),
            orderIndex: t.orderIndex,
          },
        });
    terms.push(term);
  }

  // --- 8. Levels ---
  console.log('📚 Creating Mali levels...');
  const levels: Record<string, { id: string }> = {};
  for (const lvl of MALI_LEVELS) {
    const level = await prisma.level.upsert({
      where: {
        schoolId_code: { schoolId: school.id, code: lvl.code },
      },
      update: {},
      create: {
        schoolId: school.id,
        cycle: lvl.cycle as any,
        name: lvl.name,
        code: lvl.code,
        orderIndex: lvl.orderIndex,
        isActive: true,
      },
    });
    levels[lvl.code] = level;
  }

  // --- 9. Subjects + Coefficients ---
  console.log('📖 Creating subjects and coefficients...');
  const subjects: Record<string, { id: string }> = {};
  for (const sub of STANDARD_SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: {
        schoolId_code: { schoolId: school.id, code: sub.code },
      },
      update: {},
      create: {
        schoolId: school.id,
        code: sub.code,
        name: sub.name,
        type: sub.type as any,
        isActive: true,
      },
    });
    subjects[sub.code] = subject;

    // Assign coefficients for all levels
    for (const lvl of MALI_LEVELS) {
      const levelId = levels[lvl.code].id;
      await prisma.subjectCoefficient.upsert({
        where: {
          subjectId_levelId: { subjectId: subject.id, levelId },
        },
        update: { coefficient: sub.coefficient },
        create: {
          subjectId: subject.id,
          levelId,
          coefficient: sub.coefficient,
          weeklyHours: sub.coefficient * 1.5,
        },
      });
    }
  }

  // --- 10. Rooms ---
  console.log('🚪 Creating rooms...');
  const roomsData = [
    { name: 'Salle 9A', type: 'CLASSROOM', capacity: 60 },
    { name: 'Salle 10A', type: 'CLASSROOM', capacity: 60 },
    { name: 'Salle 11A', type: 'CLASSROOM', capacity: 60 },
    { name: 'Laboratoire Sciences', type: 'LAB', capacity: 40 },
    { name: 'Salle Informatique', type: 'COMPUTER_ROOM', capacity: 30 },
    { name: 'Bibliothèque', type: 'LIBRARY', capacity: 100 },
  ];
  const rooms: Record<string, { id: string }> = {};
  for (const r of roomsData) {
    const existing = await prisma.room.findFirst({
      where: { schoolId: school.id, name: r.name },
    });
    const room = existing
      ? existing
      : await prisma.room.create({
          data: {
            schoolId: school.id,
            name: r.name,
            type: r.type as any,
            capacity: r.capacity,
            isAvailable: true,
          },
        });
    rooms[r.name] = room;
  }

  // --- 11. Classes ---
  console.log('🏛️ Creating demo classes...');
  const classesData = [
    { code: '9A', name: '9ème A', levelCode: '9EME', roomName: 'Salle 9A' },
    { code: '10A', name: '10ème A', levelCode: '10EME', roomName: 'Salle 10A' },
    { code: '11A', name: '11ème A', levelCode: '11EME', roomName: 'Salle 11A' },
  ];
  const classes: Record<string, { id: string }> = {};
  for (const c of classesData) {
    const existing = await prisma.class.findFirst({
      where: { academicYearId: academicYear.id, code: c.code },
    });
    const cls = existing
      ? existing
      : await prisma.class.create({
          data: {
            schoolId: school.id,
            academicYearId: academicYear.id,
            levelId: levels[c.levelCode].id,
            code: c.code,
            name: c.name,
            roomId: rooms[c.roomName].id,
            capacity: 60,
            status: 'OPEN',
          },
        });
    classes[c.code] = cls;
  }

  // --- 12. Demo Users ---
  console.log('👥 Creating demo users...');
  // Mot de passe initial : variable SEED_PASSWORD, sinon un mot de passe aleatoire
  // affiche une seule fois a la fin du seed. Doit etre change a la premiere connexion.
  const seedPassword = process.env.SEED_PASSWORD || `${randomBytes(9).toString('base64url')}Aa1!`;
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const usersData = [
    {
      email: 'admin@sis-mali.local',
      phone: '+22370000001',
      firstName: 'Super',
      lastName: 'Admin',
      roleCode: 'SUPER_ADMIN',
    },
    {
      email: 'director@sis-mali.local',
      phone: '+22370000002',
      firstName: 'Ibrahim',
      lastName: 'Keita',
      roleCode: 'DIRECTOR',
    },
    {
      email: 'secretary@sis-mali.local',
      phone: '+22370000003',
      firstName: 'Aminata',
      lastName: 'Traoré',
      roleCode: 'SECRETARY',
    },
    {
      email: 'teacher@sis-mali.local',
      phone: '+22370000004',
      firstName: 'Moussa',
      lastName: 'Coulibaly',
      roleCode: 'TEACHER',
    },
    {
      email: 'accountant@sis-mali.local',
      phone: '+22370000005',
      firstName: 'Fatoumata',
      lastName: 'Diallo',
      roleCode: 'ACCOUNTANT',
    },
    {
      email: 'supervisor@sis-mali.local',
      phone: '+22370000006',
      firstName: 'Oumar',
      lastName: 'Sangaré',
      roleCode: 'SUPERVISOR',
    },
  ];

  const createdUsers: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        schoolId: u.roleCode === 'SUPER_ADMIN' ? null : school.id,
        email: u.email,
        phone: u.phone,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        status: 'ACTIVE',
        mustChangePassword: true,
      },
    });
    createdUsers[u.roleCode] = user;

    // Link role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roles[u.roleCode].id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roles[u.roleCode].id,
        schoolId: u.roleCode === 'SUPER_ADMIN' ? null : school.id,
      },
    });
  }

  // --- 13. Demo Teachers ---
  console.log('👨‍🏫 Creating demo teachers...');
  const teachersData = [
    { matricule: 'ENS-2026-000001', firstName: 'Moussa', lastName: 'Coulibaly', gender: 'M', specialty: 'Mathématiques', userId: createdUsers['TEACHER'].id },
    { matricule: 'ENS-2026-000002', firstName: 'Aïssata', lastName: 'Sidibé', gender: 'F', specialty: 'Français' },
    { matricule: 'ENS-2026-000003', firstName: 'Modibo', lastName: 'Konaté', gender: 'M', specialty: 'Physique-Chimie' },
    { matricule: 'ENS-2026-000004', firstName: 'Kadiatou', lastName: 'Doumbia', gender: 'F', specialty: 'Anglais' },
    { matricule: 'ENS-2026-000005', firstName: 'Sékou', lastName: 'Touré', gender: 'M', specialty: 'Histoire-Géographie' },
  ];

  const teachers: { id: string; matricule: string }[] = [];
  for (const t of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: {
        schoolId_matricule: {
          schoolId: school.id,
          matricule: t.matricule,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        userId: (t as any).userId || null,
        matricule: t.matricule,
        firstName: t.firstName,
        lastName: t.lastName,
        gender: t.gender as any,
        specialty: t.specialty,
        status: 'ACTIVE',
        contractType: 'PERMANENT',
        hireDate: new Date('2020-09-01'),
      },
    });
    teachers.push(teacher);
  }

  // --- 14. Demo Students ---
  console.log('🎓 Creating 20 demo students...');
  const studentNames = [
    ['Amadou', 'Traoré', 'M', '2010-03-15'],
    ['Fatoumata', 'Diallo', 'F', '2010-05-22'],
    ['Moussa', 'Coulibaly', 'M', '2010-07-10'],
    ['Aïssata', 'Sidibé', 'F', '2010-11-03'],
    ['Ibrahim', 'Keita', 'M', '2010-01-28'],
    ['Mariam', 'Konaté', 'F', '2010-09-19'],
    ['Oumar', 'Sangaré', 'M', '2010-04-07'],
    ['Kadiatou', 'Doumbia', 'F', '2010-12-12'],
    ['Sékou', 'Touré', 'M', '2010-06-25'],
    ['Aminata', 'Traoré', 'F', '2010-08-30'],
    ['Bakary', 'Sissoko', 'M', '2010-02-14'],
    ['Djeneba', 'Kouyaté', 'F', '2010-10-05'],
    ['Mamadou', 'Cissé', 'M', '2010-11-20'],
    ['Awa', 'Diarra', 'F', '2010-07-18'],
    ['Souleymane', 'Kanté', 'M', '2010-03-09'],
    ['Fanta', 'Camara', 'F', '2010-05-27'],
    ['Adama', 'Dembélé', 'M', '2010-09-02'],
    ['Rokia', 'Coulibaly', 'F', '2010-12-24'],
    ['Yacouba', 'Samaké', 'M', '2010-08-11'],
    ['Oumou', 'Bah', 'F', '2010-04-16'],
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const [firstName, lastName, gender, birthDate] = studentNames[i];
    const seq = String(i + 1).padStart(6, '0');
    const matricule = `SIS-2026-${seq}`;

    const student = await prisma.student.upsert({
      where: {
        schoolId_matricule: { schoolId: school.id, matricule },
      },
      update: {},
      create: {
        schoolId: school.id,
        matricule,
        firstName,
        lastName,
        gender: gender as any,
        birthDate: new Date(birthDate),
        birthPlace: 'Bamako',
        nationality: 'Malienne',
        status: 'ACTIVE',
      },
    });

    // Enroll first 10 in 9A, next 5 in 10A, last 5 in 11A
    const className = i < 10 ? '9A' : i < 15 ? '10A' : '11A';
    const cls = classes[className];
    const levelCode = className === '9A' ? '9EME' : className === '10A' ? '10EME' : '11EME';

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, academicYearId: academicYear.id },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          classId: cls.id,
          levelId: levels[levelCode].id,
          status: 'VALIDATED',
          enrollmentDate: new Date('2026-09-15'),
        },
      });
    }
  }

  // --- 15. Fee Types & Structures ---
  console.log('💰 Creating fee types and structures...');
  const feeTypesData = [
    { code: 'INS', name: "Frais d'inscription", category: 'INSCRIPTION' },
    { code: 'SCO', name: 'Frais de scolarité', category: 'SCOLARITE' },
    { code: 'CAN', name: 'Cantine', category: 'CANTINE' },
    { code: 'TRA', name: 'Transport', category: 'TRANSPORT' },
  ];

  const feeTypes: Record<string, { id: string }> = {};
  for (const ft of feeTypesData) {
    const feeType = await prisma.feeType.upsert({
      where: { schoolId_code: { schoolId: school.id, code: ft.code } },
      update: {},
      create: {
        schoolId: school.id,
        code: ft.code,
        name: ft.name,
        category: ft.category as any,
        isActive: true,
      },
    });
    feeTypes[ft.code] = feeType;
  }

  // Fee structures per level
  const feeStructures = [
    { levelCode: '9EME', feeCode: 'INS', amount: 25000, installments: 1 },
    { levelCode: '9EME', feeCode: 'SCO', amount: 225000, installments: 3 },
    { levelCode: '10EME', feeCode: 'INS', amount: 30000, installments: 1 },
    { levelCode: '10EME', feeCode: 'SCO', amount: 275000, installments: 3 },
    { levelCode: '11EME', feeCode: 'INS', amount: 30000, installments: 1 },
    { levelCode: '11EME', feeCode: 'SCO', amount: 300000, installments: 3 },
  ];

  for (const fs of feeStructures) {
    const existing = await prisma.feeStructure.findFirst({
      where: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        levelId: levels[fs.levelCode].id,
        feeTypeId: feeTypes[fs.feeCode].id,
      },
    });
    if (!existing) {
      await prisma.feeStructure.create({
        data: {
          schoolId: school.id,
          academicYearId: academicYear.id,
          levelId: levels[fs.levelCode].id,
          feeTypeId: feeTypes[fs.feeCode].id,
          amount: fs.amount,
          dueDate: new Date('2026-10-15'),
          installments: fs.installments,
        },
      });
    }
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📌 Login credentials (all users):');
  console.log(`   Mot de passe initial : ${seedPassword}  (a changer a la premiere connexion)`);
  console.log('   admin@sis-mali.local       → SUPER_ADMIN');
  console.log('   director@sis-mali.local    → DIRECTOR');
  console.log('   secretary@sis-mali.local   → SECRETARY');
  console.log('   teacher@sis-mali.local     → TEACHER');
  console.log('   accountant@sis-mali.local  → ACCOUNTANT');
  console.log('   supervisor@sis-mali.local  → SUPERVISOR\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });