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
import archiver = require("archiver");
import * as fsPromises from "fs/promises";
import * as fsSync from "fs";

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
    const { classId, termId, academicYearId, kind } = job.data;

    // Import dynamique pour ne pas bloquer le worker si Puppeteer n'est pas dispo
    const { generateReportCardPDF } = await import(
      "../../api/src/report-cards/utils/report-card-pdf.util"
    );
    const { generateAnnualReportCardPDF } = await import(
      "../../api/src/report-cards/utils/annual-report-card-pdf.util"
    );


    // Récupérer les bulletins de la classe
    const { PrismaClient } = await import("@prisma/client");
    const prismaLocal = new PrismaClient();

    try {
      const reports = await prismaLocal.reportCard.findMany({
        where: { classId, academicYearId, ...(termId ? { termId } : {}) },
        include: {
          student: true,
          class: { include: { level: true } },
          term: true,
          academicYear: true,
          items: { include: { subject: true } },
        },
      });

      if (reports.length === 0) {
        return { success: true, count: 0, message: "Aucun bulletin" };
      }

      // Créer le ZIP
      const outputPath = `/tmp/report-cards-${classId}-${Date.now()}.zip`;
      const output = fsSync.createWriteStream(outputPath);
      const archive = (archiver as any)("zip", { zlib: { level: 9 } });

      archive.pipe(output);

      // Générer chaque PDF
      for (const report of reports) {
        try {
          let buffer: Buffer;
          if (kind === "ANNUEL" || report.kind === "ANNUEL") {
            // Pour l'annuel, on ne peut pas utiliser getAnnualExportData directement
            // On utilise le PDF période pour l'instant
            buffer = await generateReportCardPDF({
              schoolName: "SIS-MALI",
              studentName: `${report.student.lastName} ${report.student.firstName}`,
              studentMatricule: report.student.matricule,
              studentGender: report.student.gender,
              studentBirthDate: report.student.birthDate.toISOString().split("T")[0],
              studentBirthPlace: report.student.birthPlace,
              className: report.class?.name || "",
              classSize: report.classSize || 0,
              termName: report.term?.name || "",
              academicYear: report.academicYear?.label || "",
              items: report.items.map((i) => ({
                subjectName: i.subject?.name || "",
                coefficient: Number(i.coefficient),
                average: i.average !== null ? Number(i.average) : null,
                weighted: i.weighted !== null ? Number(i.weighted) : null,
                rank: i.rank,
              })),
              totalCoefficient: report.items.reduce((s, i) => s + Number(i.coefficient), 0),
              totalWeighted: report.items.reduce((s, i) => s + (Number(i.weighted) || 0), 0),
              generalAverage: report.average !== null ? Number(report.average) : null,
              rank: report.rank,
              scale: Number(report.scale) || 20,
              absencesCount: report.absencesCount,
              latesCount: report.latesCount,
              decision: report.decision,
              appreciation: report.appreciation,
            } as any);
          } else {
            buffer = await generateReportCardPDF({
              schoolName: "SIS-MALI",
              studentName: `${report.student.lastName} ${report.student.firstName}`,
              studentMatricule: report.student.matricule,
              studentGender: report.student.gender,
              studentBirthDate: report.student.birthDate.toISOString().split("T")[0],
              studentBirthPlace: report.student.birthPlace,
              className: report.class?.name || "",
              classSize: report.classSize || 0,
              termName: report.term?.name || "",
              academicYear: report.academicYear?.label || "",
              items: report.items.map((i) => ({
                subjectName: i.subject?.name || "",
                coefficient: Number(i.coefficient),
                average: i.average !== null ? Number(i.average) : null,
                weighted: i.weighted !== null ? Number(i.weighted) : null,
                rank: i.rank,
              })),
              totalCoefficient: report.items.reduce((s, i) => s + Number(i.coefficient), 0),
              totalWeighted: report.items.reduce((s, i) => s + (Number(i.weighted) || 0), 0),
              generalAverage: report.average !== null ? Number(report.average) : null,
              rank: report.rank,
              scale: Number(report.scale) || 20,
              absencesCount: report.absencesCount,
              latesCount: report.latesCount,
              decision: report.decision,
              appreciation: report.appreciation,
            } as any);
          }

          const safeName = `${report.student.lastName}-${report.student.firstName}`.replace(/[^a-z0-9-]/gi, "_");
          archive.append(buffer, { name: `bulletin-${safeName}.pdf` });
        } catch (err: any) {
          console.error(`[PDF] Erreur generation ${report.student.matricule}: ${err.message}`);
        }
      }

      await archive.finalize();
      await new Promise<void>((resolve) => output.on("close", () => resolve()));

      const stat = await fsPromises.stat(outputPath);
      return {
        success: true,
        count: reports.length,
        path: outputPath,
        size: stat.size,
        message: `${reports.length} PDF générés`,
      };
    } finally {
      await prismaLocal.$disconnect();
    }
  },
  { connection, concurrency: 1 },
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
