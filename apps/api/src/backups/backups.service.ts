import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly storageRoot = process.env.STORAGE_ROOT || "./storage";
  private readonly backupsDir = path.join(this.storageRoot, "backups");

  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, type?: string) {
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

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException("Sauvegarde introuvable");
    return backup;
  }

  /**
   * Lance une sauvegarde DB via pg_dump.
   * En environnement Docker, la commande est executee dans le conteneur postgres.
   */
  async createDatabaseBackup(schoolId: string | null, createdBy: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-db-${timestamp}.sql`;
    const filePath = path.join(this.backupsDir, fileName);

    await fs.mkdir(this.backupsDir, { recursive: true });

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL non configuree");
    }

    const backup = await this.prisma.backup.create({
      data: {
        schoolId,
        type: "DB",
        fileUrl: `/backups/${fileName}`,
        createdBy,
        status: "IN_PROGRESS",
      },
    });

    try {
      // pg_dump via shell (le binaire doit etre dans le PATH du conteneur)
      await execAsync(`pg_dump "${dbUrl}" -f "${filePath}"`, { timeout: 300000 });
      const stats = await fs.stat(filePath);

      await this.prisma.backup.update({
        where: { id: backup.id },
        data: { status: "SUCCESS", sizeBytes: BigInt(stats.size) },
      });

      this.logger.log(`Database backup created: ${fileName} (${stats.size} bytes)`);
      return { ...backup, status: "SUCCESS", sizeBytes: stats.size };
    } catch (err: any) {
      this.logger.error(`Backup failed: ${err.message}`);
      await this.prisma.backup.update({
        where: { id: backup.id },
        data: { status: "FAILED" },
      });
      throw new Error(`Sauvegarde echouee : ${err.message}`);
    }
  }

  /**
   * Restauration depuis un fichier de backup.
   * ATTENTION : operation destructive.
   */
  async restore(id: string) {
    const backup = await this.findOne(id);
    if (backup.status !== "SUCCESS") {
      throw new Error("Impossible de restaurer une sauvegarde en echec");
    }

    const fileName = path.basename(backup.fileUrl);
    const filePath = path.join(this.backupsDir, fileName);

    try {
      await fs.access(filePath);
    } catch {
      throw new Error("Fichier de sauvegarde introuvable");
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL non configuree");

    try {
      await execAsync(`psql "${dbUrl}" -f "${filePath}"`, { timeout: 600000 });
      this.logger.log(`Database restored from ${fileName}`);
      return { message: "Restauration reussie", backupId: id };
    } catch (err: any) {
      this.logger.error(`Restore failed: ${err.message}`);
      throw new Error(`Restauration echouee : ${err.message}`);
    }
  }

  async remove(id: string) {
    const backup = await this.findOne(id);
    const fileName = path.basename(backup.fileUrl);
    const filePath = path.join(this.backupsDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch {
      // Fichier deja absent, on continue
    }

    return this.prisma.backup.delete({ where: { id } });
  }
}
