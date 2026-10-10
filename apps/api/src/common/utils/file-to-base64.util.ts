import { promises as fs } from "fs";
import * as path from "path";

const STORAGE_ROOT = process.env.STORAGE_ROOT || "/app/storage";

/**
 * Transforme une URL de type "/uploads/logos/xxx.jpg" en data URL base64.
 * Utilise pour les PDF : Puppeteer ne peut pas acceder aux URLs relatives.
 *
 * - Si l'entree est deja un data URL base64, retourne tel quel.
 * - Si c'est une URL http(s), retourne null (on ne telecharge pas d'externe).
 * - Si c'est un chemin local (/uploads/...), lit le fichier et convertit.
 */
export async function fileToBase64(
  input: string | null | undefined,
): Promise<string | null> {
  if (!input) return null;

  // Deja en base64
  if (input.startsWith("data:")) return input;

  // URL http(s) → non supporte
  if (/^https?:\/\//i.test(input)) return null;

  // URL relative (ex: /uploads/logos/xxx.jpg)
  // On la mappe vers le FS : /app/storage/uploads/logos/xxx.jpg
  const relative = input.replace(/^\/+/, ""); // retire les / au debut
  const absolutePath = path.join(STORAGE_ROOT, relative);

  try {
    const buffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase().slice(1);
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "svg"
              ? "image/svg+xml"
              : "application/octet-stream";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
