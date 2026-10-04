import { promises as fs } from "fs";
import { join } from "path";

/**
 * Charge le logo d'une ecole depuis le storage local et le retourne en data-URL base64.
 * Retourne null si le logo n'existe pas ou si le fichier est introuvable.
 */
export async function loadLogoAsBase64(
  logoUrl: string | null | undefined,
): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    // logoUrl est du type : /uploads/logos/xxx.png
    // Le fichier est dans : <cwd>/storage/uploads/logos/xxx.png
    const relative = logoUrl.replace(/^\/uploads\//, "uploads/");
    const filepath = join(process.cwd(), "storage", relative);

    const buffer = await fs.readFile(filepath);

    // Detecter le mime
    const ext = filepath.split(".").pop()?.toLowerCase() || "png";
    const mime =
      ext === "svg"
        ? "image/svg+xml"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : "image/png";

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
