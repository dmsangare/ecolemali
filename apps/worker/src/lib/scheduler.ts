/**
 * SIS-MALI Worker — Scheduler de sauvegarde automatique
 *
 * Vérifie toutes les minutes si l'heure configurée est atteinte,
 * et déclenche un job de backup dans la queue BullMQ.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";

let intervalId: NodeJS.Timeout | null = null;
const triggeredKeys = new Set<string>();

/**
 * Parse une expression cron simple : "0 23 * * *"
 * Retourne { hour, minute } ou null si invalide.
 */
function parseCron(cron: string): { hour: number; minute: number } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const minute = Number(parts[0]);
  const hour = Number(parts[1]);

  if (isNaN(minute) || isNaN(hour)) return null;
  if (minute < 0 || minute > 59) return null;
  if (hour < 0 || hour > 23) return null;

  return { hour, minute };
}

/**
 * Démarre le scheduler.
 * Appelé au démarrage du worker.
 */
export function startBackupScheduler(
  connection: IORedis,
  backupQueue: Queue,
): void {
  if (intervalId) {
    console.log("[SCHEDULER] Déjà démarré, on ignore");
    return;
  }

  console.log("[SCHEDULER] Backup scheduler démarré (interval 60s)");

  intervalId = setInterval(async () => {
    try {
      await checkAndTriggerBackups(backupQueue);
    } catch (err: any) {
      console.error(`[SCHEDULER] Erreur : ${err.message}`);
    }
  }, 60_000);

  // Premier check immédiat au démarrage
  setTimeout(() => {
    checkAndTriggerBackups(backupQueue).catch((err) => {
      console.error(`[SCHEDULER] Erreur premier check : ${err.message}`);
    });
  }, 5_000);
}

/**
 * Arrête le scheduler.
 * Appelé au shutdown du worker.
 */
export function stopBackupScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[SCHEDULER] Backup scheduler arrêté");
  }
}

/**
 * Vérifie toutes les écoles et déclenche les backups si nécessaire.
 */
async function checkAndTriggerBackups(backupQueue: Queue): Promise<void> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Formater la clé anti-doublon
  const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  // Récupérer tous les settings avec backup activé
  const settings = await prisma.setting.findMany();

  for (const setting of settings) {
    try {
      const data = setting.data as any;
      const backup = data?.backup;

      if (!backup?.enabled) continue;

      const cron = parseCron(backup.cron || "0 23 * * *");
      if (!cron) {
        console.warn(
          `[SCHEDULER] Cron invalide pour école ${setting.schoolId}: ${backup.cron}`,
        );
        continue;
      }

      // Vérifier si c'est l'heure
      if (cron.hour !== currentHour || cron.minute !== currentMinute) {
        continue;
      }

      // Anti-doublon
      const triggerKey = `${setting.schoolId}:${minuteKey}`;
      if (triggeredKeys.has(triggerKey)) {
        continue;
      }
      triggeredKeys.add(triggerKey);

      // Nettoyer les vieilles clés (au-delà de 1h)
      if (triggeredKeys.size > 100) {
        triggeredKeys.clear();
      }

      console.log(
        `[SCHEDULER] ⏰ Déclenchement du backup pour école ${setting.schoolId}`,
      );

      // Récupérer un createdBy (premier utilisateur actif)
      const adminUser = await prisma.user.findFirst({
        where: {
          status: "ACTIVE",
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      const createdBy = adminUser?.id || null;

      // Push le job dans la queue
      await backupQueue.add(
        "daily-backup",
        {
          schoolId: setting.schoolId,
          createdBy,
          triggeredAt: now.toISOString(),
        },
        {
          removeOnComplete: 100, // garde les 100 derniers jobs
          removeOnFail: 50,
        },
      );

      console.log(
        `[SCHEDULER] ✅ Job poussé pour ${setting.schoolId} (createdBy=${createdBy})`,
      );
    } catch (err: any) {
      console.error(
        `[SCHEDULER] Erreur pour école ${setting.schoolId}: ${err.message}`,
      );
    }
  }
}
