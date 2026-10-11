import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateSessionInput,
  GenerateDossiersInput,
  PatchDossierInput,
  PatchPieceInput,
  TransmitInput,
  ReceiveInput,
} from './dto';

// Transitions autorisées entre statuts (CDC 12.3)
const TRANSITIONS: Record<string, string[]> = {
  BROUILLON: ['PIECES_MANQUANTES', 'PRET_VERIFICATION', 'VALIDE_ETABLISSEMENT'],
  PIECES_MANQUANTES: ['PRET_VERIFICATION', 'BROUILLON'],
  PRET_VERIFICATION: ['VALIDE_ETABLISSEMENT', 'PIECES_MANQUANTES', 'A_CORRIGER'],
  VALIDE_ETABLISSEMENT: ['TRANSMIS'],
  TRANSMIS: ['RECEPTION_CONFIRMEE', 'A_CORRIGER'],
  RECEPTION_CONFIRMEE: ['CLOTURE', 'A_CORRIGER'],
  A_CORRIGER: ['COMPLETE', 'PIECES_MANQUANTES'],
  COMPLETE: ['RECEPTION_CONFIRMEE', 'TRANSMIS'],
  CLOTURE: [],
};

@Injectable()
export class StateExamDossiersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // SESSIONS
  // ============================================================

  async listSessions(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const sessions = await this.prisma.stateExamSession.findMany({
      where,
      include: {
        academicYear: { select: { id: true, startDate: true, endDate: true, isCurrent: true } },
        _count: { select: { dossiers: true } },
      },
      orderBy: [{ examType: 'asc' }, { createdAt: 'desc' }],
    });
    return { data: sessions };
  }

  async getSession(schoolId: string, id: string) {
    const session = await this.prisma.stateExamSession.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: true,
        dossiers: {
          include: {
            class: { select: { id: true, name: true, code: true } },
            level: { select: { id: true, name: true, cycle: true } },
            _count: { select: { pieces: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Session introuvable');
    return { data: session };
  }

  async createSession(schoolId: string, userId: string, input: CreateSessionInput) {
    // Unicité : une session par (school, year, examType)
    const existing = await this.prisma.stateExamSession.findFirst({
      where: { schoolId, academicYearId: input.academicYearId, examType: input.examType },
    });
    if (existing) {
      throw new ConflictException(
        `Une session ${input.examType} existe déjà pour cette année`,
      );
    }

    const created = await this.prisma.stateExamSession.create({
      data: {
        schoolId,
        academicYearId: input.academicYearId,
        examType: input.examType,
        label: input.label,
        registrationOpens: input.registrationOpens ? new Date(input.registrationOpens) : null,
        registrationCloses: input.registrationCloses ? new Date(input.registrationCloses) : null,
        examDate: input.examDate ? new Date(input.examDate) : null,
        institutionTarget: input.institutionTarget,
        bordereauPattern: input.bordereauPattern,
        createdBy: userId,
      },
    });
    return { data: created };
  }

  // ============================================================
  // GENERATION AUTOMATIQUE DES DOSSIERS PAR CLASSE
  // ============================================================

  async generateDossiers(
    schoolId: string,
    userId: string,
    sessionId: string,
    input: GenerateDossiersInput,
  ) {
    const session = await this.prisma.stateExamSession.findFirst({
      where: { id: sessionId, schoolId },
    });
    if (!session) throw new NotFoundException('Session introuvable');

    // Trouver les classes du niveau correspondant (DEF -> level.stateExamType = DEF)
    const classes = await this.prisma.class.findMany({
      where: {
        schoolId,
        academicYearId: session.academicYearId,
        ...(input.classIds?.length ? { id: { in: input.classIds } } : {}),
        level: { stateExamType: session.examType },
      },
      include: { level: true },
    });

    if (classes.length === 0) {
      throw new BadRequestException(
        `Aucune classe de niveau ${session.examType} trouvée pour cette année`,
      );
    }

    const created: any[] = [];
    for (const cls of classes) {
      // Skip si dossier déjà existant
      const existing = await this.prisma.examDossier.findFirst({
        where: { sessionId, classId: cls.id },
      });
      if (existing) continue;

      // Compter les élèves actifs inscrits dans la classe
      const candidateCount = await this.prisma.enrollment.count({
        where: {
          classId: cls.id,
          academicYearId: session.academicYearId,
          status: 'VALIDATED',
        },
      });

      const dossier = await this.prisma.examDossier.create({
        data: {
          sessionId,
          schoolId,
          classId: cls.id,
          levelId: cls.levelId,
          status: 'BROUILLON',
          candidateCount,
          piecesRequired: input.piecesRequired as any,
          createdBy: userId,
        },
      });
      created.push(dossier);
    }

    return { data: created, generated: created.length, skipped: classes.length - created.length };
  }

  // ============================================================
  // DOSSIERS
  // ============================================================

  async getDossier(schoolId: string, id: string) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id, schoolId },
      include: {
        session: true,
        class: { select: { id: true, name: true, code: true } },
        level: { select: { id: true, name: true, cycle: true } },
        pieces: {
          include: {
            student: {
              select: { id: true, matricule: true, firstName: true, lastName: true },
            },
          },
          orderBy: [{ student: { lastName: 'asc' } }, { pieceType: 'asc' }],
        },
      },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    return { data: dossier };
  }

  async patchDossier(schoolId: string, id: string, patch: PatchDossierInput) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id, schoolId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    if (dossier.status === 'TRANSMIS' || dossier.status === 'RECEPTION_CONFIRMEE' || dossier.status === 'CLOTURE') {
      throw new BadRequestException('Dossier verrouillé après transmission');
    }

    const updated = await this.prisma.examDossier.update({
      where: { id },
      data: {
        observations: patch.observations ?? undefined,
        piecesRequired: patch.piecesRequired ?? undefined,
        bordereauNumber: patch.bordereauNumber ?? undefined,
        referenceNumber: patch.referenceNumber ?? undefined,
      },
    });
    return { data: updated };
  }

  async changeStatus(schoolId: string, id: string, newStatus: string) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id, schoolId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');

    const allowed = TRANSITIONS[dossier.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transition interdite : ${dossier.status} → ${newStatus}. Autorisé : ${allowed.join(', ') || '(aucune)'}`,
      );
    }

    const updated = await this.prisma.examDossier.update({
      where: { id },
      data: { status: newStatus as any },
    });
    return { data: updated };
  }

  // ============================================================
  // PIECES
  // ============================================================

  async upsertPiece(
    schoolId: string,
    dossierId: string,
    studentId: string,
    pieceType: string,
    patch: PatchPieceInput,
    userId: string,
  ) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id: dossierId, schoolId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');

    const piece = await this.prisma.examDossierPiece.upsert({
      where: {
        dossierId_studentId_pieceType: { dossierId, studentId, pieceType },
      },
      update: {
        isPresent: patch.isPresent ?? undefined,
        fileUrl: patch.fileUrl ?? undefined,
        notes: patch.notes ?? undefined,
        verifiedAt: patch.isPresent ? new Date() : undefined,
        verifiedBy: patch.isPresent ? userId : undefined,
      },
      create: {
        dossierId,
        studentId,
        pieceType,
        isPresent: patch.isPresent ?? false,
        fileUrl: patch.fileUrl,
        notes: patch.notes,
      },
    });
    return { data: piece };
  }

  // ============================================================
  // TRANSMISSION
  // ============================================================

  async transmit(schoolId: string, userId: string, dossierId: string, input: TransmitInput) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id: dossierId, schoolId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');

    // Verifier toutes les pieces requises
    const required = (dossier.piecesRequired as string[]) ?? [];
    if (required.length > 0) {
      const missing = await this.prisma.examDossierPiece.count({
        where: {
          dossierId,
          pieceType: { in: required },
          isPresent: false,
        },
      });
      if (missing > 0) {
        throw new BadRequestException(
          `Impossible de transmettre : ${missing} pièce(s) manquante(s) sur ${required.length} requise(s)`,
        );
      }
    }

    const allowed = TRANSITIONS[dossier.status] ?? [];
    if (!allowed.includes('TRANSMIS')) {
      throw new BadRequestException(
        `Impossible de transmettre depuis le statut ${dossier.status}`,
      );
    }

    const updated = await this.prisma.examDossier.update({
      where: { id: dossierId },
      data: {
        status: 'TRANSMIS',
        transmittedAt: input.transmittedAt ? new Date(input.transmittedAt) : new Date(),
        transmittedBy: userId,
        proofUrl: input.proofUrl,
        observations: input.observations ?? dossier.observations,
      },
    });
    return { data: updated };
  }

  async receive(schoolId: string, userId: string, dossierId: string, input: ReceiveInput) {
    const dossier = await this.prisma.examDossier.findFirst({
      where: { id: dossierId, schoolId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    if (dossier.status !== 'TRANSMIS' && dossier.status !== 'COMPLETE') {
      throw new BadRequestException('Seul un dossier transmis peut être réceptionné');
    }

    const updated = await this.prisma.examDossier.update({
      where: { id: dossierId },
      data: {
        status: 'RECEPTION_CONFIRMEE',
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        receivedBy: userId,
        receiptUrl: input.receiptUrl,
        observations: input.observations ?? dossier.observations,
      },
    });
    return { data: updated };
  }
}
