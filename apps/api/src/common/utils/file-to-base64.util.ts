import { promises as fs } from "fs";
import * as path from "path";

const STORAGE_ROOT = process.env.STORAGE_ROOT || "/app/storage";

export async function fileToBase64(input: string | null | undefined): Promise<string | null> {
  if (!input) return null;
  if (input.startsWith("data:")) return input;
  if (/^https?:\/\//i.test(input)) return null;

  let relative = input.replace(/^\/+/, "");
  if (relative.startsWith("api/v1/files/documents/")) {
    relative = relative.replace(/^api\/v1\/files\/documents\//, "generated/");
  } else {
    relative = relative.replace(/^api\/v1\/files\//, "");
  }

  const root = path.resolve(STORAGE_ROOT);
  const absolutePath = path.resolve(root, relative);
  if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
    return null;
  }

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
