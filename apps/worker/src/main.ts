/**
 * SIS-MALI Worker — Point d'entree
 *
 * Traitement des jobs asynchrones : PDF, notifications, sauvegardes.
 */
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { runFullBackup, cleanupOldBackups } from "./lib/backup";
import { startBackupScheduler, stopBackupScheduler } from "./lib/scheduler";
import { prisma } from "./lib/prisma";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("connect", () => {
  console.log("[Worker] Connecte a Redis");
});

connection.on("error", (err) => {
  console.error("[Worker] Erreur Redis:", err.message);
});

// ============================================================
// QUEUES
// ============================================================

const pdfQueue = new Queue("pdf-generation", { connection });
const notificationQueue = new Queue("notifications", { connection });
const backupQueue = new Queue("backups", { connection });

// ============================================================
// WORKERS
// ============================================================

const pdfWorker = new Worker(
  "pdf-generation",
  async (job) => {
    console.log(`[PDF] Traitement du job ${job.id}`, job.data);
    // TODO: Implementer avec Puppeteer
    return { success: true, jobId: job.id };
  },
  { connection, concurrency: 2 },
);

const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    console.log(`[Notification] Traitement du job ${job.id}`, job.data);
    // TODO: Implementer (SMS, WhatsApp, Email)
    return { success: true, jobId: job.id };
  },
  { connection, concurrency: 5 },
);

const backupWorker = new Worker(
  "backups",
  async (job) => {
    console.log(`[Backup] Job ${job.id} démarré`, job.data);

    const { schoolId, createdBy } = job.data;

    if (!createdBy) {
      console.warn(`[Backup] createdBy manquant, utilisation de null`);
    }

    try {
      // 1. Créer le backup
      const result = await runFullBackup(schoolId, createdBy || null);
      console.log(
        `[Backup] ✅ Terminé : ${result.timestamp} (${formatBytes(result.sizeBytes)})`,
      );

      // 2. Nettoyage rétention
      try {
        const cleanup = await cleanupOldBackups(schoolId);
        console.log(`[Backup] Nettoyage : ${cleanup.deleted} supprimé(s)`);
      } catch (cleanupErr: any) {
        console.error(`[Backup] Erreur cleanup : ${cleanupErr.message}`);
        // On ne rejette pas le job — le backup a réussi
      }

      return result;
    } catch (err: any) {
      console.error(`[Backup] ❌ Échec : ${err.message}`);
      throw err;
    }
  },
  { connection, concurrency: 1 },
);

// ============================================================
// EVENT HANDLERS
// ============================================================

[pdfWorker, notificationWorker, backupWorker].forEach((worker) => {
  worker.on("completed", (job) => {
    console.log(`[${worker.name}] Job ${job.id} termine`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} echoue:`, err.message);
  });
});

// ============================================================
// SCHEDULER (BACKUP AUTOMATIQUE)
// ============================================================

startBackupScheduler(connection, backupQueue);

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdown = async () => {
  console.log("[Worker] Arret en cours...");

  // 1. Arrêter le scheduler
  stopBackupScheduler();

  // 2. Fermer les workers
  await Promise.all([
    pdfWorker.close(),
    notificationWorker.close(),
    backupWorker.close(),
  ]);

  // 3. Fermer les queues
  await Promise.all([
    pdfQueue.close(),
    notificationQueue.close(),
    backupQueue.close(),
  ]);

  // 4. Déconnecter Prisma
  await prisma.$disconnect();

  // 5. Déconnecter Redis
  await connection.quit();

  console.log("[Worker] Arrete proprement");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ============================================================
// HELPERS
// ============================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ============================================================
// STARTUP LOG
// ============================================================

console.log("[Worker] SIS-MALI demarre");
console.log("[Worker] Queues : pdf-generation, notifications, backups");
console.log("[Worker] Scheduler : actif (vérification toutes les 60s)");
