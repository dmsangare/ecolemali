import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen, ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  Send, PackageCheck, User, Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

const unwrap = (res: any) => res.data?.data ?? res.data;

const apiDossier = {
  getDossier: async (id: string) => {
    const res = await api.get(`/state-exam-dossiers/dossiers/${id}`);
    return unwrap(res);
  },
  upsertPiece: async (
    dossierId: string,
    studentId: string,
    pieceType: string,
    body: { isPresent: boolean; notes?: string },
  ) => {
    const res = await api.post(
      `/state-exam-dossiers/dossiers/${dossierId}/students/${studentId}/pieces/${pieceType}`,
      body,
    );
    return unwrap(res);
  },
  changeStatus: async (id: string, status: string) => {
    const res = await api.post(`/state-exam-dossiers/dossiers/${id}/status`, { status });
    return unwrap(res);
  },
  transmit: async (id: string, body: any) => {
    const res = await api.post(`/state-exam-dossiers/dossiers/${id}/transmit`, body);
    return unwrap(res);
  },
  receive: async (id: string, body: any) => {
    const res = await api.post(`/state-exam-dossiers/dossiers/${id}/receive`, body);
    return unwrap(res);
  },
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  PIECES_MANQUANTES: "Pièces manquantes",
  PRET_VERIFICATION: "Prêt à vérifier",
  VALIDE_ETABLISSEMENT: "Validé établissement",
  TRANSMIS: "Transmis",
  RECEPTION_CONFIRMEE: "Réception confirmée",
  A_CORRIGER: "À corriger",
  COMPLETE: "Complété",
  CLOTURE: "Clôturé",
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-yellow-100 text-yellow-800",
  PIECES_MANQUANTES: "bg-orange-100 text-orange-800",
  PRET_VERIFICATION: "bg-blue-100 text-blue-800",
  VALIDE_ETABLISSEMENT: "bg-indigo-100 text-indigo-800",
  TRANSMIS: "bg-cyan-100 text-cyan-800",
  RECEPTION_CONFIRMEE: "bg-emerald-100 text-emerald-800",
  A_CORRIGER: "bg-red-100 text-red-800",
  COMPLETE: "bg-green-100 text-green-800",
  CLOTURE: "bg-slate-200 text-slate-700",
};

const PIECE_LABELS: Record<string, string> = {
  ACTE_NAISSANCE: "Acte de naissance",
  CERTIFICAT_SCOLARITE: "Certificat scolarité",
  PHOTO: "Photo",
  FRAIS: "Frais",
};

export function StateExamDossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");

  const dossierQ = useQuery({
    queryKey: ["state-exam-dossiers", "dossier", id],
    queryFn: () => apiDossier.getDossier(id!),
    enabled: !!id,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["state-exam-dossiers", "dossier", id] });

  const upsertMut = useMutation({
    mutationFn: (args: { studentId: string; pieceType: string; isPresent: boolean }) =>
      apiDossier.upsertPiece(id!, args.studentId, args.pieceType, {
        isPresent: args.isPresent,
      }),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const transmitMut = useMutation({
    mutationFn: () => apiDossier.transmit(id!, {}),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const receiveMut = useMutation({
    mutationFn: () => apiDossier.receive(id!, {}),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => apiDossier.changeStatus(id!, status),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  if (dossierQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dossierQ.isError || !dossierQ.data) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">Dossier introuvable</p>
        <Link to="/state-exam-dossiers" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Retour</Button>
        </Link>
      </div>
    );
  }

  const dossier: any = dossierQ.data;
  const pieces: any[] = dossier.pieces ?? [];
  const piecesRequired: string[] = dossier.piecesRequired ?? [
    "ACTE_NAISSANCE",
    "CERTIFICAT_SCOLARITE",
    "PHOTO",
    "FRAIS",
  ];

  // Grouper les pieces par etudiant
  const byStudent: Record<string, { student: any; pieces: Record<string, any> }> = {};
  for (const p of pieces) {
    const sid = p.student?.id ?? p.studentId;
    if (!byStudent[sid]) {
      byStudent[sid] = { student: p.student, pieces: {} };
    }
    byStudent[sid].pieces[p.pieceType] = p;
  }

  // Calcul statistiques
  const students = Object.values(byStudent);
  const totalStudents = students.length;
  const totalCells = totalStudents * piecesRequired.length;
  const totalPresent = students.reduce(
    (s, st) => s + piecesRequired.filter((pt) => st.pieces[pt]?.isPresent).length,
    0,
  );
  const completionRate = totalCells > 0 ? Math.round((totalPresent / totalCells) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Link to={`/state-exam-dossiers/sessions/${dossier.session?.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <FolderOpen className="h-6 w-6 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">
              {dossier.session?.examType}
            </span>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[dossier.status]}`}>
              {STATUS_LABELS[dossier.status]}
            </span>
            {dossier.bordereauNumber && (
              <span className="font-mono text-xs text-muted-foreground">
                {dossier.bordereauNumber}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {dossier.class?.name ?? "Classe inconnue"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dossier.session?.label ?? "Session inconnue"} — {dossier.level?.name ?? "—"}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Candidats
            </div>
            <div className="text-3xl font-bold mt-1">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Pièces fournies
            </div>
            <div className="text-3xl font-bold mt-1">
              {totalPresent}
              <span className="text-base text-muted-foreground"> / {totalCells}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Complétude
            </div>
            <div className="text-3xl font-bold mt-1">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions workflow */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {dossier.status === "VALIDE_ETABLISSEMENT" && (
            <Button onClick={() => transmitMut.mutate()} disabled={transmitMut.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Enregistrer le dépôt au CAP
            </Button>
          )}
          {dossier.status === "TRANSMIS" && (
            <Button onClick={() => receiveMut.mutate()} disabled={receiveMut.isPending}>
              <PackageCheck className="h-4 w-4 mr-2" />
              Marquer réception
            </Button>
          )}
          {dossier.status === "BROUILLON" && (
            <>
              <Button
                variant="outline"
                onClick={() => statusMut.mutate("PIECES_MANQUANTES")}
                disabled={statusMut.isPending}
              >
                Marquer pièces manquantes
              </Button>
              <Button
                onClick={() => statusMut.mutate("PRET_VERIFICATION")}
                disabled={statusMut.isPending}
              >
                Marquer prêt à vérifier
              </Button>
            </>
          )}
          {dossier.status === "PRET_VERIFICATION" && (
            <Button
              onClick={() => statusMut.mutate("VALIDE_ETABLISSEMENT")}
              disabled={statusMut.isPending}
            >
              Valider l'établissement
            </Button>
          )}
        </div>
      )}

      {/* Tableau candidats x pièces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Candidats et pièces justificatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalStudents === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun candidat pour ce dossier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-2 font-medium">Candidat</th>
                    {piecesRequired.map((pt) => (
                      <th key={pt} className="text-center p-2 font-medium">
                        {PIECE_LABELS[pt] ?? pt}
                      </th>
                    ))}
                    <th className="text-center p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => {
                    const present = piecesRequired.filter(
                      (pt) => st.pieces[pt]?.isPresent,
                    ).length;
                    return (
                      <tr key={st.student?.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <div className="font-medium">
                            {st.student?.lastName} {st.student?.firstName}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {st.student?.matricule}
                          </div>
                        </td>
                        {piecesRequired.map((pt) => {
                          const isPresent = !!st.pieces[pt]?.isPresent;
                          return (
                            <td key={pt} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={!canManage || upsertMut.isPending}
                                onClick={() =>
                                  upsertMut.mutate({
                                    studentId: st.student.id,
                                    pieceType: pt,
                                    isPresent: !isPresent,
                                  })
                                }
                                className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors ${
                                  isPresent
                                    ? "bg-green-100 border-green-400 text-green-700 hover:bg-green-200"
                                    : "bg-background border-input hover:bg-muted"
                                }`}
                                title={isPresent ? "Pièce fournie (cliquer pour retirer)" : "Cliquer pour marquer présente"}
                              >
                                {isPresent ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center">
                          <span
                            className={`text-xs font-medium ${
                              present === piecesRequired.length
                                ? "text-green-700"
                                : "text-orange-600"
                            }`}
                          >
                            {present}/{piecesRequired.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
