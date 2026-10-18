import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

/**
 * BLOC A — Service de verification des documents signes.
 *
 * Chaque document (carte, bulletin, recu, attestation...) est signe par
 * un HMAC-SHA256. Le QR code contient un shortCode (unique) et un token.
 * L'endpoint public /verify/:shortCode revalide le token cote serveur.
 */

export type DocumentType =
  | "ID_CARD"
  | "BULLETIN"
  | "RECEIPT"
  | "INVOICE"
  | "ATTESTATION"
  | "CERTIFICATE";

export interface SignDocumentInput {
  schoolId: string;
  type: DocumentType;
  referenceId: string;
  meta?: Record<string, any>;
  expiresAt?: Date;
}

export interface SignDocumentResult {
  shortCode: string;
  hmacToken: string;
  verificationUrl: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly secret: string;

  constructor(private readonly prisma: PrismaService) {
    // Cle derivee du JWT_SECRET pour ne pas exposer la cle principale.
    const base = process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET manquant"); })();
    this.secret = `verification:${base}`;
  }

  /** Genere un HMAC-SHA256 (hex) sur les donnees canoniques du document. */
  private computeHmac(input: {
    shortCode: string;
    type: string;
    referenceId: string;
    schoolId: string;
  }): string {
    const payload = [
      input.shortCode,
      input.type,
      input.referenceId,
      input.schoolId,
    ].join("|");
    return createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  /** Signe un nouveau document et retourne le short code + token. */
  async sign(input: SignDocumentInput): Promise<SignDocumentResult> {
    // Generer un short code unique (12 caracteres URL-safe)
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = randomBytes(6).toString("base64url").slice(0, 10);
      attempts++;
      if (attempts > 5) throw new Error("Impossible de generer un code unique");
    } while (
      await this.prisma.verifiableDocument.findUnique({
        where: { shortCode },
      })
    );

    const hmacToken = this.computeHmac({
      shortCode,
      type: input.type,
      referenceId: input.referenceId,
      schoolId: input.schoolId,
    });

    await this.prisma.verifiableDocument.create({
      data: {
        schoolId: input.schoolId,
        type: input.type,
        referenceId: input.referenceId,
        shortCode,
        hmacToken,
        meta: input.meta ?? undefined,
        expiresAt: input.expiresAt ?? undefined,
      },
    });

    const baseUrl = process.env.PUBLIC_URL || "http://192.168.0.150";
    return {
      shortCode,
      hmacToken,
      verificationUrl: `${baseUrl}/v/${shortCode}`,
    };
  }

  /** Verifie un document par son shortCode et son token. */
  async verify(shortCode: string, token: string) {
    const doc = await this.prisma.verifiableDocument.findUnique({
      where: { shortCode },
    });
    if (!doc) {
      throw new NotFoundException("Document introuvable");
    }

    // Verifier la signature en temps constant
    const expected = this.computeHmac({
      shortCode: doc.shortCode,
      type: doc.type,
      referenceId: doc.referenceId,
      schoolId: doc.schoolId,
    });

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(doc.hmacToken, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new NotFoundException("Signature invalide");
    }

    if (doc.revokedAt) {
      return { valid: false, reason: "REVOKED", doc };
    }
    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return { valid: false, reason: "EXPIRED", doc };
    }

    // Incrementer le compteur de vues
    await this.prisma.verifiableDocument.update({
      where: { id: doc.id },
      data: { viewCount: { increment: 1 }, lastViewAt: new Date() },
    });

    return { valid: true, doc };
  }

  /** Revoque un document (fraude detectee, perte, etc.). */
  async revoke(shortCode: string, revokedBy: string) {
    const doc = await this.prisma.verifiableDocument.findUnique({
      where: { shortCode },
    });
    if (!doc) throw new NotFoundException("Document introuvable");

    return this.prisma.verifiableDocument.update({
      where: { id: doc.id },
      data: { revokedAt: new Date(), revokedBy },
    });
  }

  /** Retourne les infos publiques d'un document (sans verif token). */
  async findPublicByShortCode(shortCode: string) {
    const doc = await this.prisma.verifiableDocument.findUnique({
      where: { shortCode },
    });
    if (!doc) throw new NotFoundException("Document introuvable");
    return {
      valid: !doc.revokedAt,
      revoked: !!doc.revokedAt,
      type: doc.type,
      schoolId: doc.schoolId,
      referenceId: doc.referenceId,
      meta: doc.meta,
      viewCount: doc.viewCount,
      createdAt: doc.createdAt,
    };
  }

  /** Genere l'URL publique de verification pour un shortCode. */
  buildQrPayload(shortCode: string, hmacToken: string): string {
    const baseUrl = process.env.PUBLIC_URL || "http://192.168.0.150";
    return `${baseUrl}/v/${shortCode}/${hmacToken}`;
  }
}
