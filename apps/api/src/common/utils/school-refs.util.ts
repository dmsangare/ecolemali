import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface SchoolRefs {
  academicYearId?: string | null;
  levelId?: string | null;
  roomId?: string | null;
  classId?: string | null;
  teacherId?: string | null;
  subjectId?: string | null;
  studentId?: string | null;
}

type Check = { label: string; run: () => Promise<{ id: string } | null> };

/**
 * Verifie que chaque identifiant fourni appartient bien a l'etablissement `schoolId`.
 * A appeler dans create/update AVANT d'ecrire en base.
 */
export async function assertRefsInSchool(
  prisma: PrismaService,
  schoolId: string,
  refs: SchoolRefs,
): Promise<void> {
  const checks: Check[] = [];
  const select = { id: true } as const;

  if (refs.academicYearId) {
    const id = refs.academicYearId;
    checks.push({ label: "Annee scolaire", run: () => prisma.academicYear.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.levelId) {
    const id = refs.levelId;
    checks.push({ label: "Niveau", run: () => prisma.level.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.roomId) {
    const id = refs.roomId;
    checks.push({ label: "Salle", run: () => prisma.room.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.classId) {
    const id = refs.classId;
    checks.push({ label: "Classe", run: () => prisma.class.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.teacherId) {
    const id = refs.teacherId;
    checks.push({ label: "Enseignant", run: () => prisma.teacher.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.subjectId) {
    const id = refs.subjectId;
    checks.push({ label: "Matiere", run: () => prisma.subject.findFirst({ where: { id, schoolId }, select }) });
  }
  if (refs.studentId) {
    const id = refs.studentId;
    checks.push({ label: "Eleve", run: () => prisma.student.findFirst({ where: { id, schoolId }, select }) });
  }

  const results = await Promise.all(checks.map((c) => c.run()));
  const missing = checks.filter((_, i) => !results[i]).map((c) => c.label);
  if (missing.length > 0) {
    throw new BadRequestException(`Reference invalide pour cet etablissement : ${missing.join(", ")}`);
  }
}
