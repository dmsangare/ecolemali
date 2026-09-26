import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma singleton pour le worker.
 * Évite les fuites de connexion (une seule instance partagée).
 */
export const prisma = new PrismaClient({
  log: ["warn", "error"],
});

// Gestion propre à l'arrêt du process
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
