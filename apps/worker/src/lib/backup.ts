/**
 * SIS-MALI Worker — Logique de sauvegarde
 *
 * Duplique la logique de l'API (apps/api/src/backups/backups.service.ts)
 * pour permettre au worker de créer des backups automatiques
 * sans dépendre de l'API NestJS.
 */
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { prisma } from "./prisma";

const execAsync = promisify(exec);

const STORAGE_ROOT = process.env.STORAGE_ROOT || "/app/storage";
const BACKUPS_DIR = path.join(STORAGE_ROOT, "backups");
const DOCUMENTS_DIR = path.join(STORAGE_ROOT, "documents");

// ============================================================
// TYPES
// ============================================================

interface DbParams {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

interface FullBackupResult {
  id: string;
  timestamp: string;
  sizeBytes: number;
  files: {
    db: string;
    documents: string;
    checksum: string;
  };
}

// ============================================================
// PARSE DATABASE_URL
// ============================================================

function parseDbUrl(): DbParams {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL non configuree");

  const match = url.match(
    /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/,
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

// ============================================================
// TIMESTAMP
// ============================================================

function makeTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

// ============================================================
// OPÉRATIONS BAS NIVEAU
// ============================================================

async function dumpDatabase(outputPath: string): Promise<void> {
  const db = parseDbUrl();
  const cmd = [
    `PGPASSWORD="${db.password}"`,
    "pg_dump",
    `-h ${db.host}`,
    `-p ${db.port}`,
    `-U ${db.user}`,
    `-d ${db.database}`,
    "--no-owner",
    "--no-acl",
    "--clean",
    "--if-exists",
    `| gzip -6 > "${outputPath}"`,
  ].join(" ");

  await execAsync(cmd, { timeout: 600_000, shell: "/bin/sh" });
}

async function archiveDocuments(outputPath: string): Promise<void> {
  try {
    await fs.access(DOCUMENTS_DIR);
  } catch {
    // Pas de dossier documents → créer un tar vide
    await execAsync(`tar -czf "${outputPath}" --files-from /dev/null`, {
      timeout: 300_000,
    });
    return;
  }

  await execAsync(`tar -czf "${outputPath}" -C "${DOCUMENTS_DIR}" .`, {
    timeout: 600_000,
  });
}

async function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = require("fs").createReadStream(filePath);
    stream.on("data", (chunk: Buffer) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

// ============================================================
// BACKUP COMPLET
// ============================================================

/**
 * Crée un backup complet (DB + documents) dans storage/backups/.
 * Enregistre le backup en base de données.
 *
 * @param schoolId - ID de l'école (null pour SUPER_ADMIN)
 * @param createdBy - ID de l'utilisateur qui déclenche
 */
export async function runFullBackup(
  schoolId: string | null,
  createdBy: string,
): Promise<FullBackupResult> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const timestamp = makeTimestamp();
  const dbFile = `backup-${timestamp}-DB.sql.gz`;
  const filesFile = `backup-${timestamp}-FILES.tar.gz`;
  const checksumFile = `backup-${timestamp}.sha256`;

  const dbPath = path.join(BACKUPS_DIR, dbFile);
  const filesPath = path.join(BACKUPS_DIR, filesFile);
  const checksumPath = path.join(BACKUPS_DIR, checksumFile);

  // Créer le record
  const record = await prisma.backup.create({
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
    console.log(`[BACKUP] DB dump → ${dbFile}`);
    await dumpDatabase(dbPath);

    // 2. Archive documents
    console.log(`[BACKUP] Documents → ${filesFile}`);
    await archiveDocuments(filesPath);

    // 3. Checksum
    const dbChecksum = await calculateChecksum(dbPath);
    const filesChecksum = await calculateChecksum(filesPath);

    const checksumContent = `${dbChecksum} ${dbFile}\n${filesChecksum} ${filesFile}\n`;
    await fs.writeFile(checksumPath, checksumContent, "utf-8");

    // 4. Taille totale
    const dbStats = await fs.stat(dbPath);
    const filesStats = await fs.stat(filesPath);
    const totalSize = dbStats.size + filesStats.size;

    // 5. Mise à jour
    await prisma.backup.update({
      where: { id: record.id },
      data: {
        status: "SUCCESS",
        sizeBytes: BigInt(totalSize),
      },
    });

    console.log(
      `[BACKUP] Full backup OK : ${timestamp} (${formatBytes(totalSize)})`,
    );

    return {
      id: record.id,
      timestamp,
      sizeBytes: totalSize,
      files: {
        db: dbFile,
        documents: filesFile,
        checksum: checksumFile,
      },
    };
  } catch (err: any) {
    console.error(`[BACKUP] Échec : ${err.message}`);
    await prisma.backup.update({
      where: { id: record.id },
      data: { status: "FAILED" },
    });
    throw new Error(`Sauvegarde echouee : ${err.message}`);
  }
}

// ============================================================
// NETTOYAGE (RÉTENTION)
// ============================================================

/**
 * Applique la rétention : garde N quotidiens + N hebdo + N mensuels.
 * Supprime les autres.
 */
export async function cleanupOldBackups(
  schoolId: string | null,
): Promise<{ deleted: number }> {
  // Récupérer la config
  const defaults = {
    retention: { daily: 7, weekly: 4, monthly: 12 },
  };

  let settings = defaults;
  if (schoolId) {
    const setting = await prisma.setting.findUnique({
      where: { schoolId },
    });
    const data = setting?.data as any;
    if (data?.backup?.retention) {
      settings = { retention: data.backup.retention };
    }
  }

  const { daily, weekly, monthly } = settings.retention;

  const where: any = { status: "SUCCESS" };
  if (schoolId) where.schoolId = schoolId;

  const all = await prisma.backup.findMany({
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

  // Garder 1 par semaine sur N semaines
  const weekMap = new Map<string, string>();
  for (const b of all) {
    const d = new Date(b.createdAt);
    const diffWeeks = Math.floor(
      (now.getTime() - d.getTime()) / (7 * 24 * 3600 * 1000),
    );
    if (diffWeeks < weekly) {
      const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, b.id);
    }
  }
  for (const id of weekMap.values()) toKeep.add(id);

  // Garder 1 par mois sur N mois
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
      await removeBackup(b.id);
      deleted++;
    }
  }

  console.log(`[CLEANUP] ${deleted} anciennes sauvegardes supprimées`);
  return { deleted };
}

// ============================================================
// SUPPRESSION
// ============================================================

async function removeBackup(id: string): Promise<void> {
  const backup = await prisma.backup.findUnique({ where: { id } });
  if (!backup) return;

  const timestamp = path.basename(backup.fileUrl);
  const files = [
    `backup-${timestamp}-DB.sql.gz`,
    `backup-${timestamp}-FILES.tar.gz`,
    `backup-${timestamp}.sha256`,
  ];

  for (const f of files) {
    try {
      await fs.unlink(path.join(BACKUPS_DIR, f));
    } catch {
      // Fichier absent → on continue
    }
  }

  await prisma.backup.delete({ where: { id } });
}

// ============================================================
// HELPERS
// ============================================================

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
