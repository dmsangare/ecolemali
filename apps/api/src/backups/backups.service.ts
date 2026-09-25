import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import type { BackupSettingsUpdateDto } from "./dto";

const execAsync = promisify(exec);

interface DbParams {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly storageRoot = process.env.STORAGE_ROOT || "./storage";
  private readonly backupsDir = path.join(this.storageRoot, "backups");
  private readonly documentsDir = path.join(this.storageRoot, "documents");

  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════
  // PARSE DATABASE_URL
  // ═══════════════════════════════════════════════════════════

  private parseDbUrl(): DbParams {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL non configuree");

    const match = url.match(
      /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
    );
    if (!match) throw new Error("DATABASE_URL invalide");

    return {
      user: decodeURIComponent(match[1]),
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  // ═══════════════════════════════════════════════════════════
  // LISTE / DÉTAIL
  // ═══════════════════════════════════════════════════════════

  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    type?: string
  ) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.backup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.backup.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException("Sauvegarde introuvable");
    return backup;
  }

  // ═══════════════════════════════════════════════════════════
  // CRÉATION DE BACKUP
  // ═══════════════════════════════════════════════════════════

  /**
   * Crée un backup complet (DB + documents).
   * Fichiers :
   *   backup-{timestamp}-DB.sql.gz
   *   backup-{timestamp}-FILES.tar.gz
   *   backup-{timestamp}.sha256
   */
  async createFullBackup(schoolId: string | null, createdBy: string) {
    await fs.mkdir(this.backupsDir, { recursive: true });

    const timestamp = this.makeTimestamp();
    const dbFile = `backup-${timestamp}-DB.sql.gz`;
    const filesFile = `backup-${timestamp}-FILES.tar.gz`;
    const checksumFile = `backup-${timestamp}.sha256`;

    const record = await this.prisma.backup.create({
      data: {
        schoolId,
        type: "FULL",
        fileUrl: `/backups/${timestamp}`,
        createdBy,
        status: "IN_PROGRESS",
      },
    });

    try {
      // 1. Dump DB
      this.logger.log(`[BACKUP] DB dump → ${dbFile}`);
      await this.dumpDatabase(path.join(this.backupsDir, dbFile));

      // 2. Archive documents
      this.logger.log(`[BACKUP] Documents → ${filesFile}`);
      await this.archiveDocuments(path.join(this.backupsDir, filesFile));

      // 3. Checksum
      const dbChecksum = await this.calculateChecksum(
        path.join(this.backupsDir, dbFile)
      );
      const filesChecksum = await this.calculateChecksum(
        path.join(this.backupsDir, filesFile)
      );

      const checksumContent = `${dbChecksum} ${dbFile}\n${filesChecksum} ${filesFile}\n`;
      await fs.writeFile(
        path.join(this.backupsDir, checksumFile),
        checksumContent,
        "utf-8"
      );

      // 4. Taille totale
      const dbStats = await fs.stat(path.join(this.backupsDir, dbFile));
      const filesStats = await fs.stat(path.join(this.backupsDir, filesFile));
      const totalSize = dbStats.size + filesStats.size;

      // 5. Mise à jour
      const updated = await this.prisma.backup.update({
        where: { id: record.id },
        data: {
          status: "SUCCESS",
          sizeBytes: BigInt(totalSize),
        },
      });

      this.logger.log(
        `[BACKUP] Full backup OK : ${timestamp} (${this.formatBytes(totalSize)})`
      );

      return {
        ...updated,
        sizeBytes: totalSize,
        files: { db: dbFile, documents: filesFile, checksum: checksumFile },
      };
    } catch (err: any) {
      this.logger.error(`[BACKUP] Échec : ${err.message}`);
      await this.prisma.backup.update({
        where: { id: record.id },
        data: { status: "FAILED" },
      });
      throw new Error(`Sauvegarde echouee : ${err.message}`);
    }
  }

  /**
   * Crée un backup DB seul (rétrocompatibilité).
   */
  async createDatabaseBackup(schoolId: string | null, createdBy: string) {
    await fs.mkdir(this.backupsDir, { recursive: true });

    const timestamp = this.makeTimestamp();
    const dbFile = `backup-${timestamp}-DB.sql.gz`;
    const checksumFile = `backup-${timestamp}.sha256`;

    const record = await this.prisma.backup.create({
      data: {
        schoolId,
        type: "DB",
        fileUrl: `/backups/${timestamp}`,
        createdBy,
        status: "IN_PROGRESS",
      },
    });

    try {
      await this.dumpDatabase(path.join(this.backupsDir, dbFile));

      const dbChecksum = await this.calculateChecksum(
        path.join(this.backupsDir, dbFile)
      );
      await fs.writeFile(
        path.join(this.backupsDir, checksumFile),
        `${dbChecksum} ${dbFile}\n`,
        "utf-8"
      );

      const stats = await fs.stat(path.join(this.backupsDir, dbFile));

      const updated = await this.prisma.backup.update({
        where: { id: record.id },
        data: { status: "SUCCESS", sizeBytes: BigInt(stats.size) },
      });

      this.logger.log(
        `[BACKUP] DB backup OK : ${timestamp} (${this.formatBytes(stats.size)})`
      );

      return {
        ...updated,
        sizeBytes: stats.size,
        files: { db: dbFile, checksum: checksumFile },
      };
    } catch (err: any) {
      this.logger.error(`[BACKUP] Échec : ${err.message}`);
      await this.prisma.backup.update({
        where: { id: record.id },
        data: { status: "FAILED" },
      });
      throw new Error(`Sauvegarde echouee : ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OPÉRATIONS BAS NIVEAU
  // ═══════════════════════════════════════════════════════════

  private async dumpDatabase(outputPath: string): Promise<void> {
    const db = this.parseDbUrl();
    const cmd = [
      `PGPASSWORD="${db.password}"`,
      "pg_dump",
      `-h ${db.host}`,
      `-p ${db.port}`,
      `-U ${db.user}`,
      `-d ${db.database}`,
      "--no-owner",
      "--no-acl",
      `| gzip -6 > "${outputPath}"`,
    ].join(" ");

    await execAsync(cmd, { timeout: 600_000, shell: "/bin/sh" });
  }

  private async archiveDocuments(outputPath: string): Promise<void> {
    try {
      await fs.access(this.documentsDir);
    } catch {
      // Pas de dossier documents → créer un tar vide
      await execAsync(`tar -czf "${outputPath}" --files-from /dev/null`, {
        timeout: 300_000,
      });
      return;
    }

    await execAsync(
      `tar -czf "${outputPath}" -C "${this.documentsDir}" .`,
      { timeout: 600_000 }
    );
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = require("fs").createReadStream(filePath);
      stream.on("data", (chunk: Buffer) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TÉLÉCHARGEMENT
  // ═══════════════════════════════════════════════════════════

  async getFilePath(
    id: string,
    part: "db" | "files" | "checksum"
  ): Promise<{ path: string; filename: string }> {
    const backup = await this.findOne(id);
    const timestamp = path.basename(backup.fileUrl);

    let filename: string;
    switch (part) {
      case "db":
        filename = `backup-${timestamp}-DB.sql.gz`;
        break;
      case "files":
        filename = `backup-${timestamp}-FILES.tar.gz`;
        break;
      case "checksum":
        filename = `backup-${timestamp}.sha256`;
        break;
    }

    const filePath = path.join(this.backupsDir, filename);

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(`Fichier introuvable : ${filename}`);
    }

    return { path: filePath, filename };
  }

  // ═══════════════════════════════════════════════════════════
  // RESTAURATION
  // ═══════════════════════════════════════════════════════════

  async restore(
    id: string,
    userId: string,
    createSafetyBackup = true
  ) {
    const backup = await this.findOne(id);
    if (backup.status !== "SUCCESS") {
      throw new BadRequestException(
        "Impossible de restaurer une sauvegarde en echec"
      );
    }

    const timestamp = path.basename(backup.fileUrl);
    const dbFile = path.join(
      this.backupsDir,
      `backup-${timestamp}-DB.sql.gz`
    );
    const filesFile = path.join(
      this.backupsDir,
      `backup-${timestamp}-FILES.tar.gz`
    );
    const checksumFile = path.join(
      this.backupsDir,
      `backup-${timestamp}.sha256`
    );

    // 1. Vérifier existence
    try {
      await fs.access(dbFile);
    } catch {
      throw new NotFoundException("Fichier de sauvegarde introuvable");
    }

    // 2. Vérifier checksum (si présent)
    let checksumOk = false;
    try {
      await fs.access(checksumFile);
      const expected = await fs.readFile(checksumFile, "utf-8");
      const lines = expected.trim().split("\n");

      for (const line of lines) {
        const [hash, name] = line.split(/\s+/);
        const targetFile = path.join(this.backupsDir, name);
        const actual = await this.calculateChecksum(targetFile);
        if (actual !== hash) {
          throw new BadRequestException(
            `Checksum invalide pour ${name} — fichier corrompu`
          );
        }
      }
      checksumOk = true;
      this.logger.log(`[RESTORE] Checksum OK pour ${timestamp}`);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`[RESTORE] Pas de checksum pour ${timestamp}`);
    }

    // 3. Backup de sécurité
    let safetyBackupId: string | null = null;
    if (createSafetyBackup) {
      this.logger.log(`[RESTORE] Backup de sécurité…`);
      try {
        const safety = await this.createDatabaseBackup(
          backup.schoolId,
          userId
        );
        safetyBackupId = safety.id;
        this.logger.log(`[RESTORE] Safety backup id=${safety.id}`);
      } catch (err: any) {
        this.logger.error(`[RESTORE] Safety backup échoué : ${err.message}`);
        throw new Error(
          `Impossible de créer le backup de sécurité : ${err.message}`
        );
      }
    }

    // 4. Restaurer DB
    try {
      this.logger.log(`[RESTORE] Restauration DB…`);
      await this.restoreDatabase(dbFile);
    } catch (err: any) {
      this.logger.error(`[RESTORE] Échec DB : ${err.message}`);
      throw new Error(`Restauration DB échouée : ${err.message}`);
    }

    // 5. Restaurer documents (si FULL et fichier présent)
    if (backup.type === "FULL") {
      try {
        await fs.access(filesFile);
        this.logger.log(`[RESTORE] Restauration documents…`);
        await this.restoreDocuments(filesFile);
      } catch {
        this.logger.warn(`[RESTORE] Pas de fichier documents à restaurer`);
      }
    }

    // 6. Log audit
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          schoolId: backup.schoolId,
          action: "RESTORE",
          module: "backup",
          objectType: "Backup",
          objectId: backup.id,
          newValue: {
            timestamp,
            checksumOk,
            safetyBackupId,
          } as any,
        },
      });
    } catch (err: any) {
      this.logger.warn(`[RESTORE] Log audit échoué : ${err.message}`);
    }

    this.logger.log(`[RESTORE] ✅ Terminé pour ${timestamp}`);

    return {
      message: "Restauration reussie",
      backupId: id,
      timestamp,
      safetyBackupId,
      checksumVerified: checksumOk,
    };
  }

  private async restoreDatabase(filePath: string): Promise<void> {
    const db = this.parseDbUrl();
    const cmd = [
      `gunzip -c "${filePath}"`,
      "|",
      `PGPASSWORD="${db.password}"`,
      "psql",
      `-h ${db.host}`,
      `-p ${db.port}`,
      `-U ${db.user}`,
      `-d ${db.database}`,
      "--quiet",
      "--no-psqlrc",
    ].join(" ");

    await execAsync(cmd, { timeout: 900_000, shell: "/bin/sh" });
  }

  private async restoreDocuments(filePath: string): Promise<void> {
    // Sauvegarder l'ancien dossier
    const oldDir = `${this.documentsDir}.before-restore-${Date.now()}`;
    try {
      await fs.access(this.documentsDir);
      await fs.rename(this.documentsDir, oldDir);
    } catch {
      // pas de dossier existant
    }

    // Créer le nouveau + extraire
    await fs.mkdir(this.documentsDir, { recursive: true });
    await execAsync(
      `tar -xzf "${filePath}" -C "${this.documentsDir}"`,
      { timeout: 300_000 }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SUPPRESSION + NETTOYAGE
  // ═══════════════════════════════════════════════════════════

  async remove(id: string) {
    const backup = await this.findOne(id);
    const timestamp = path.basename(backup.fileUrl);

    const files = [
      `backup-${timestamp}-DB.sql.gz`,
      `backup-${timestamp}-FILES.tar.gz`,
      `backup-${timestamp}.sha256`,
    ];

    for (const f of files) {
      try {
        await fs.unlink(path.join(this.backupsDir, f));
      } catch {
        // fichier absent → on continue
      }
    }

    return this.prisma.backup.delete({ where: { id } });
  }

  async cleanupOld(schoolId: string | null): Promise<{ deleted: number }> {
    const settings = await this.getSettings(schoolId);
    const { daily, weekly, monthly } = settings.retention;

    const where: any = { status: "SUCCESS" };
    if (schoolId) where.schoolId = schoolId;

    const all = await this.prisma.backup.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (all.length === 0) return { deleted: 0 };

    const now = new Date();
    const toKeep = new Set<string>();

    // Garder les N derniers quotidiens
    for (let i = 0; i < Math.min(daily, all.length); i++) {
      toKeep.add(all[i].id);
    }

    // Garder 1 par semaine sur les N dernières semaines
    const weekMap = new Map<string, string>();
    for (const b of all) {
      const d = new Date(b.createdAt);
      const diffWeeks = Math.floor(
        (now.getTime() - d.getTime()) / (7 * 24 * 3600 * 1000)
      );
      if (diffWeeks < weekly) {
        const weekKey = `${d.getFullYear()}-W${this.getWeekNumber(d)}`;
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, b.id);
      }
    }
    for (const id of weekMap.values()) toKeep.add(id);

    // Garder 1 par mois sur les N derniers mois
    const monthMap = new Map<string, string>();
    for (const b of all) {
      const d = new Date(b.createdAt);
      const diffMonths =
        (now.getFullYear() - d.getFullYear()) * 12 +
        (now.getMonth() - d.getMonth());
      if (diffMonths < monthly) {
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, b.id);
      }
    }
    for (const id of monthMap.values()) toKeep.add(id);

    // Supprimer les autres
    let deleted = 0;
    for (const b of all) {
      if (!toKeep.has(b.id)) {
        await this.remove(b.id);
        deleted++;
      }
    }

    this.logger.log(`[CLEANUP] ${deleted} anciennes sauvegardes supprimées`);
    return { deleted };
  }

  private getWeekNumber(d: Date): number {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(
      ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  async getSettings(schoolId: string | null) {
    const defaults = {
      enabled: false,
      cron: "0 23 * * *",
      includeFiles: true,
      retention: { daily: 7, weekly: 4, monthly: 12 },
      lastRun: null as string | null,
      lastStatus: null as string | null,
      nextRun: null as string | null,
    };

    if (!schoolId) return defaults;

    const setting = await this.prisma.setting.findUnique({
      where: { schoolId },
    });

    if (!setting?.data) return defaults;

    const data = setting.data as any;
    return { ...defaults, ...(data.backup || {}) };
  }

  async updateSettings(schoolId: string, dto: BackupSettingsUpdateDto) {
    if (!schoolId) {
      throw new BadRequestException(
        "schoolId requis pour modifier les paramètres"
      );
    }

    const current = await this.getSettings(schoolId);
    const merged = { ...current, ...dto };

    const setting = await this.prisma.setting.findUnique({
      where: { schoolId },
    });

    const existingData = (setting?.data as any) || {};
    const newData = { ...existingData, backup: merged };

    await this.prisma.setting.upsert({
      where: { schoolId },
      create: {
        schoolId,
        data: newData,
      },
      update: {
        data: newData,
      },
    });

    return merged;
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  private makeTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
    );
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
