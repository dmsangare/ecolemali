/**
 * SIS-MALI — Database Seed (PRODUCTION)
 *
 * Ce seed cree UNIQUEMENT :
 *   1. Les roles systeme (RBAC)
 *   2. Les permissions (matrice module:action)
 *   3. La matrice role-permission
 *   4. UN SEUL utilisateur : le Super Admin
 *
 * Aucune donnee de demonstration (eleves, classes, notes, paiements, etc.).
 * Le Super Admin cree lui-meme l'ecole, l'annee scolaire, les niveaux,
 * les matieres et tous les utilisateurs via l'interface de l'application.
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
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log('🌱 SIS-MALI — Seed production (vierge)\n');

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

  // --- 4. Super Admin (seul utilisateur cree) ---
  console.log('\n👤 Creating Super Admin...');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@sis-mali.local';
  const superAdminFirstname = process.env.SUPER_ADMIN_FIRSTNAME || 'Super';
  const superAdminLastname = process.env.SUPER_ADMIN_LASTNAME || 'Admin';
  const seedPassword =
    process.env.SUPER_ADMIN_PASSWORD ||
    `${randomBytes(9).toString('base64url')}Aa1!`;
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      schoolId: null,
      email: superAdminEmail,
      passwordHash,
      firstName: superAdminFirstname,
      lastName: superAdminLastname,
      status: 'ACTIVE',
      mustChangePassword: true,
    },
  });

  // Lier le role SUPER_ADMIN
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: roles['SUPER_ADMIN'].id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: roles['SUPER_ADMIN'].id,
    },
  });

  // --- 5. Resume ---
  console.log('\n✅ Seed completed successfully!\n');
  console.log('============================================================');
  console.log('🔑 CREDENTIALS SUPER ADMIN (a changer a la 1ere connexion)');
  console.log('============================================================');
  console.log(`   Email      : ${superAdminEmail}`);
  console.log(`   Mot de passe : ${seedPassword}`);
  console.log('');
  console.log('⚠️  Ce mot de passe ne sera plus affiche. Notez-le maintenant.');
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
