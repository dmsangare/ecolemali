import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, ArrowLeft, Loader2, FileText, FolderOpen,
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

const unwrap = (res: any) => res.data?.data ?? res.data;

const apiDossiers = {
  getSession: async (id: string) => {
    const res = await api.get(`/state-exam-dossiers/sessions/${id}`);
    return unwrap(res);
  },
  generateDossiers: async (id: string, body?: any) => {
    const res = await api.post(
      `/state-exam-dossiers/sessions/${id}/generate-dossiers`,
      body ?? {},
    );
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

export function StateExamSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");

  const sessionQ = useQuery({
    queryKey: ["state-exam-dossiers", "session", id],
    queryFn: () => apiDossiers.getSession(id!),
    enabled: !!id,
  });

  const generateMut = useMutation({
    mutationFn: () => apiDossiers.generateDossiers(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state-exam-dossiers", "session", id] });
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  if (sessionQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionQ.isError || !sessionQ.data) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">Session introuvable</p>
        <Link to="/state-exam-dossiers" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Retour</Button>
        </Link>
      </div>
    );
  }

  const session = sessionQ.data as any;
  const dossiers = session.dossiers ?? [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Link to="/state-exam-dossiers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                session.examType === "DEF"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {session.examType}
            </span>
            <span className="text-xs text-muted-foreground">
              Session {new Date(session.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{session.label}</h1>
          {session.academicYear && (
            <p className="text-sm text-muted-foreground">
              Année scolaire {new Date(session.academicYear.startDate).getFullYear()}-
              {new Date(session.academicYear.endDate).getFullYear()}
            </p>
          )}
        </div>
      </div>

      {/* Fiche info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations de la session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Ouverture inscr.</div>
              <div className="font-medium">
                {session.registrationOpens
                  ? new Date(session.registrationOpens).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Clôture inscr.</div>
              <div className="font-medium">
                {session.registrationCloses
                  ? new Date(session.registrationCloses).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Date d'examen</div>
              <div className="font-medium">
                {session.examDate
                  ? new Date(session.examDate).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Destinataire</div>
              <div className="font-medium">{session.institutionTarget ?? "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action : générer dossiers */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Dossiers par classe ({dossiers.length})
        </h2>
        {canManage && dossiers.length === 0 && (
          <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
            {generateMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération…
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4 mr-2" />
                Générer les dossiers
              </>
            )}
          </Button>
        )}
      </div>

      {/* Liste des dossiers */}
      <Card>
        <CardContent className="p-0">
          {dossiers.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun dossier généré. Cliquez sur "Générer les dossiers" pour créer
                un dossier par classe de {session.examType}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Classe</th>
                    <th className="text-left p-3 font-medium">Niveau</th>
                    <th className="text-center p-3 font-medium">Candidats</th>
                    <th className="text-left p-3 font-medium">Statut</th>
                    <th className="text-left p-3 font-medium">Bordereau</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d: any) => (
                    <tr key={d.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{d.class?.name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {d.level?.name ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {d.candidateCount ?? 0}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            STATUS_COLORS[d.status] ?? "bg-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {d.bordereauNumber ?? "—"}
                      </td>
                      <td className="p-3 text-right">
                        <Link to={`/state-exam-dossiers/dossiers/${d.id}`}>
                          <Button variant="ghost" size="sm">
                            Ouvrir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
