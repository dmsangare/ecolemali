/**
 * API client — Vérification publique de documents (BLOC 9.5)
 */

export interface VerificationResult {
  id: string;
  type: string;
  shortCode: string;
  revokedAt: string | null;
  createdAt: string;
  viewCount?: number;
  meta: {
    studentName?: string;
    studentMatricule?: string;
    className?: string;
    average?: number | null;
    scale?: number;
    kind?: string;
    status?: string;
    academicYear?: string;
    termName?: string;
    [key: string]: any;
  };
  school?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

export async function verifyDocument(shortCode: string): Promise<VerificationResult> {
  // Endpoint public — pas d'auth requise
  const res = await fetch(`/api/v1/verify/${encodeURIComponent(shortCode)}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Document introuvable. Le code est peut-être erroné.');
    }
    if (res.status === 429) {
      throw new Error('Trop de tentatives. Réessayez dans une minute.');
    }
    throw new Error('Erreur de vérification. Réessayez.');
  }

  return res.json();
}
