/**
 * SIS-MALI Worker — Point d'entree
 * Traitement des jobs asynchrones : PDF, notifications, sauvegardes.
 */
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('connect', () => {
  console.log('[Worker] Connecte a Redis');
});

connection.on('error', (err) => {
  console.error('[Worker] Erreur Redis:', err.message);
});

// ============================================================
// QUEUES
// ============================================================

const pdfQueue = new Queue('pdf-generation', { connection });
const notificationQueue = new Queue('notifications', { connection });
const backupQueue = new Queue('backups', { connection });

// ============================================================
// WORKERS
// ============================================================

const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    console.log(`[PDF] Traitement du job ${job.id}`, job.data);
    // TODO: Implementer avec Puppeteer
    return { success: true, jobId: job.id };
  },
  { connection, concurrency: 2 },
);

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.log(`[Notification] Traitement du job ${job.id}`, job.data);
    // TODO: Implementer (SMS, WhatsApp, Email)
    return { success: true, jobId: job.id };
  },
  { connection, concurrency: 5 },
);

const backupWorker = new Worker(
  'backups',
  async (job) => {
    console.log(`[Backup] Traitement du job ${job.id}`, job.data);
    // TODO: Implementer avec pg_dump
    return { success: true, jobId: job.id };
  },
  { connection, concurrency: 1 },
);

// ============================================================
// EVENT HANDLERS
// ============================================================

[pdfWorker, notificationWorker, backupWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`[${worker.name}] Job ${job.id} termine`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} echoue:`, err.message);
  });
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdown = async () => {
  console.log('[Worker] Arret en cours...');
  await Promise.all([
    pdfWorker.close(),
    notificationWorker.close(),
    backupWorker.close(),
  ]);
  await connection.quit();
  console.log('[Worker] Arrete proprement');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[Worker] SIS-MALI demarre');
console.log('[Worker] Queues : pdf-generation, notifications, backups');
