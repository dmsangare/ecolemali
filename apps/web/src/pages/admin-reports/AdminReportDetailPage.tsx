import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, FileText, Loader2, Download, Send, CheckCircle2,
  Unlock, AlertCircle, RefreshCw, FileSpreadsheet, History,
  Send as SendIcon, ScrollText, Truck, PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminReportsApi,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_CATEGORY_LABELS,
} from "@/api/admin-reports";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// Helpers de rendu des donnees dynamiques
// ============================================================

function renderValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function renderObjectAsTable(obj: any): JSX.Element {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(obj).map(([k, v]) => (
          <tr key={k} className="border-b">
            <td className="p-2 font-medium text-muted-foreground w-1/3">{k}</td>
            <td className="p-2">{renderValue(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderArrayAsTable(arr: any[]): JSX.Element {
  if (!arr.length) return <p className="text-sm text-muted-foreground">Aucune donnée</p>;
  const keys = Array.from(
    new Set(arr.flatMap((row) => (row && typeof row === "object" ? Object.keys(row) : []))),
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {keys.map((k) => (
              <th key={k} className="text-left p-2 font-medium">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              {keys.map((k) => (
                <td key={k} className="p-2">{renderValue(row?.[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderDataTree(data: any, depth = 0): JSX.Element {
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (Array.isArray(data)) {
    return renderArrayAsTable(data);
  }
  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (depth === 0) {
      return (
        <div className="space-y-4">
          {entries.map(([k, v]) => (
            <Card key={k}>
              <CardHeader>
                <CardTitle className="text-sm capitalize">{k.replace(/_/g, " ")}</CardTitle>
              </CardHeader>
              <CardContent>{renderDataTree(v, depth + 1)}</CardContent>
            </Card>
          ))}
        </div>
      );
    }
    // Sous-objet : si c'est un objet plat, afficher en table cle/valeur
    if (!Array.isArray(data) && typeof data === "object" && entries.every(([, v]) => typeof v !== "object" || v === null)) {
      return renderObjectAsTable(data);
    }
    // Sinon : afficher en tableau cle/valeur
    return (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs font-medium text-muted-foreground mb-1">{k}</div>
            {renderDataTree(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  return <span>{renderValue(data)}</span>;
}

// ============================================================
// Page detail
// ============================================================

export function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");

  // Transmission
  const [transmitOpen, setTransmitOpen] = useState(false);
  const [tRecipient, setTRecipient] = useState("");
  const [tRecipientRole, setTRecipientRole] = useState("");
  const [tChannel, setTChannel] = useState("DEPOT_PHYSIQUE");
  const [tReference, setTReference] = useState("");
  const [tObs, setTObs] = useState("");

  // Reception
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [rReceipt, setRReceipt] = useState("");
  const [rObs, setRObs] = useState("");

  const reportQ = useQuery({
    queryKey: ["admin-reports", "detail", id],
    queryFn: () => adminReportsApi.getReport(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reports", "detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-reports", "list"] });
  };

  // --- Mutations ---
  const regenMut = useMutation({
    mutationFn: () => adminReportsApi.generateReport(id!),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const submitMut = useMutation({
    mutationFn: () => adminReportsApi.submitReport(id!),
    onSuccess: () => {
      invalidate();
      setSubmitOpen(false);
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const validateMut = useMutation({
    mutationFn: () => adminReportsApi.validateReport(id!),
    onSuccess: () => {
      invalidate();
      setValidateOpen(false);
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const unlockMut = useMutation({
    mutationFn: (reason: string) => adminReportsApi.unlockReport(id!, reason),
    onSuccess: () => {
      invalidate();
      setUnlockOpen(false);
      setUnlockReason("");
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const transmitMut = useMutation({
    mutationFn: () =>
      adminReportsApi.transmitReport(id!, {
        recipient: tRecipient,
        recipientRole: tRecipientRole || undefined,
        channel: tChannel,
        referenceNumber: tReference || undefined,
        observations: tObs || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setTransmitOpen(false);
      setTRecipient("");
      setTRecipientRole("");
      setTChannel("DEPOT_PHYSIQUE");
      setTReference("");
      setTObs("");
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const receiveMut = useMutation({
    mutationFn: () =>
      adminReportsApi.receiveReport(id!, {
        receiptUrl: rReceipt || undefined,
        observations: rObs || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReceiveOpen(false);
      setRReceipt("");
      setRObs("");
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  // --- Chargement ---
  if (reportQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reportQ.isError || !reportQ.data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">Rapport introuvable</p>
        <Link to="/admin-reports" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const report = reportQ.data;
  const statusClass = REPORT_STATUS_COLORS[report.status];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Link to="/admin-reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">{report.code}</span>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusClass}`}>
              {REPORT_STATUS_LABELS[report.status]}
            </span>
            {report.version > 1 && (
              <span className="text-xs text-muted-foreground">Version {report.version}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{report.title}</h1>
          {report.template?.category && (
            <p className="text-sm text-muted-foreground">
              {REPORT_CATEGORY_LABELS[report.template.category] ?? report.template.category}
            </p>
          )}
          {report.bordereauNumber && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Bordereau : {report.bordereauNumber}
            </p>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 flex-wrap">
        {report.status === "BROUILLON" && canManage && (
          <>
            <Button
              variant="outline"
              onClick={() => regenMut.mutate()}
              disabled={regenMut.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenMut.isPending ? "animate-spin" : ""}`} />
              Régénérer les données
            </Button>
            <Button
              onClick={() => setSubmitOpen(true)}
              disabled={submitMut.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre à vérification
            </Button>
          </>
        )}

        {(report.status === "EN_VERIFICATION" || report.status === "A_VALIDER") && canManage && (
          <Button onClick={() => setValidateOpen(true)} disabled={validateMut.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider le rapport
          </Button>
        )}

        {(report.status === "VALIDE" || report.status === "TRANSMIS" || report.status === "RECEPTION_CONFIRMEE") && (
          <>
            <Button
              variant="outline"
              onClick={() => adminReportsApi.downloadPdf(report.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => adminReportsApi.downloadExcel(report.id)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Télécharger Excel
            </Button>
          </>
        )}

        {canManage && report.status === "VALIDE" && (
          <Button onClick={() => setTransmitOpen(true)}>
            <Truck className="h-4 w-4 mr-2" />
            Transmettre
          </Button>
        )}

        {canManage && report.status === "TRANSMIS" && (
          <Button onClick={() => setReceiveOpen(true)}>
            <PackageCheck className="h-4 w-4 mr-2" />
            Marquer réception
          </Button>
        )}

        {canManage && (report.status === "VALIDE" || report.status === "TRANSMIS" || report.status === "A_CORRIGER") && (
          <Button
            variant="outline"
            onClick={() => setUnlockOpen(true)}
            disabled={unlockMut.isPending}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Déverrouiller
          </Button>
        )}
      </div>

      {/* Tabs : Données / Versions / Transmissions / Journal */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">
            <FileText className="h-4 w-4 mr-2" />
            Données
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            Versions ({report.versions?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="transmissions">
            <SendIcon className="h-4 w-4 mr-2" />
            Transmissions ({report.transmissions?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="h-4 w-4 mr-2" />
            Journal ({report.auditLogs?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* --- Onglet Données --- */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Données du rapport</CardTitle>
            </CardHeader>
            <CardContent>
              {report.data && Object.keys(report.data).length > 0 ? (
                renderDataTree(report.data)
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucune donnée. Cliquez sur "Régénérer les données" pour pré-remplir.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Onglet Versions --- */}
        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des versions</CardTitle>
            </CardHeader>
            <CardContent>
              {!report.versions || report.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune version enregistrée. Une version est créée à la validation.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.versions.map((v) => (
                    <div key={v.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {v.version}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      {v.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{v.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Onglet Transmissions --- */}
        <TabsContent value="transmissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des transmissions</CardTitle>
            </CardHeader>
            <CardContent>
              {!report.transmissions || report.transmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune transmission enregistrée.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.transmissions.map((t) => (
                    <div key={t.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-medium">{t.recipient}</div>
                          {t.recipientRole && (
                            <div className="text-xs text-muted-foreground">{t.recipientRole}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {t.channel} — {new Date(t.sentAt).toLocaleString("fr-FR")}
                          </div>
                          {t.bordereauNumber && (
                            <div className="text-xs font-mono mt-1">{t.bordereauNumber}</div>
                          )}
                        </div>
                      </div>
                      {t.observations && (
                        <p className="text-sm text-muted-foreground mt-2">{t.observations}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Onglet Journal --- */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Journal d'audit</CardTitle>
            </CardHeader>
            <CardContent>
              {!report.auditLogs || report.auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun évènement enregistré.</p>
              ) : (
                <div className="space-y-2">
                  {report.auditLogs.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 border-b py-2 last:border-0">
                      <span className="font-mono text-xs text-muted-foreground min-w-[100px]">
                        {new Date(a.createdAt).toLocaleString("fr-FR")}
                      </span>
                      <span className="font-medium text-sm">{a.action}</span>
                      {a.details && (
                        <span className="text-xs text-muted-foreground flex-1 truncate">
                          {JSON.stringify(a.details)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Modal Soumettre --- */}
      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Soumettre le rapport à vérification"
        description="Le rapport passera en statut 'En vérification'. Un contrôleur pourra ensuite le valider."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending}
            >
              {submitMut.isPending ? "Envoi…" : "Confirmer la soumission"}
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Une fois soumis, le rapport ne pourra plus être modifié tant qu'il n'est pas
          validé ou renvoyé en brouillon.
        </p>
      </Modal>

      {/* --- Modal Valider --- */}
      <Modal
        open={validateOpen}
        onClose={() => setValidateOpen(false)}
        title="Valider le rapport"
        description="La validation fige une version (snapshot) et rend le rapport prêt à être transmis."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setValidateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => validateMut.mutate()}
              disabled={validateMut.isPending}
            >
              {validateMut.isPending ? "Validation…" : "Confirmer la validation"}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p>
            Une fois validé, le rapport sera <strong>verrouillé</strong> et une copie de
            ses données sera conservée telle quelle.
          </p>
          <p className="text-muted-foreground">
            Pour modifier à nouveau, il faudra le déverrouiller (ce qui créera une nouvelle
            version).
          </p>
        </div>
      </Modal>

      {/* --- Modal Déverrouiller --- */}
      <Modal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        title="Déverrouiller le rapport"
        description="Une nouvelle version sera créée. La version actuelle est conservée dans l'historique."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setUnlockOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (unlockReason.trim().length < 5) {
                  alert("Motif trop court (min 5 caractères)");
                  return;
                }
                unlockMut.mutate(unlockReason);
              }}
              disabled={unlockMut.isPending || unlockReason.trim().length < 5}
            >
              {unlockMut.isPending ? "Déverrouillage…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Label htmlFor="unlock-reason">Motif du déverrouillage (obligatoire)</Label>
          <Input
            id="unlock-reason"
            placeholder="Ex: erreur dans les effectifs, correction demandée par le CAP…"
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 5 caractères. Ce motif sera enregistré dans le journal d'audit.
          </p>
        </div>
      </Modal>

      {/* --- Modal Transmettre --- */}
      <Modal
        open={transmitOpen}
        onClose={() => setTransmitOpen(false)}
        title="Transmettre le rapport"
        description="Enregistrez l'envoi au destinataire. Un numéro de bordereau sera généré automatiquement."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setTransmitOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => transmitMut.mutate()}
              disabled={transmitMut.isPending || tRecipient.trim().length < 3}
            >
              {transmitMut.isPending ? "Enregistrement…" : "Enregistrer la transmission"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-recipient">Destinataire *</Label>
            <Input
              id="t-recipient"
              placeholder="Ex: CAP de Bamako Rive Droite"
              value={tRecipient}
              onChange={(e) => setTRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-role">Fonction du destinataire</Label>
            <Input
              id="t-role"
              placeholder="Ex: Chef de CAP"
              value={tRecipientRole}
              onChange={(e) => setTRecipientRole(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Canal de transmission *</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "DEPOT_PHYSIQUE", l: "Dépôt physique" },
                { v: "COURRIER", l: "Courrier" },
                { v: "EMAIL_ADMIN", l: "Email administratif" },
                { v: "PORTAIL_OFFICIEL", l: "Portail officiel" },
                { v: "API_OFFICIELLE", l: "API officielle" },
              ].map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setTChannel(c.v)}
                  className={`rounded-md border p-2 text-sm text-left transition-colors ${
                    tChannel === c.v
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {c.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-ref">Numéro de référence (optionnel)</Label>
            <Input
              id="t-ref"
              placeholder="Ex: 2026/CAP-BKO/0456"
              value={tReference}
              onChange={(e) => setTReference(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-obs">Observations (optionnel)</Label>
            <Input
              id="t-obs"
              placeholder="Notes complémentaires"
              value={tObs}
              onChange={(e) => setTObs(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* --- Modal Reception --- */}
      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Marquer comme réceptionné"
        description="Enregistrez la confirmation de réception par le destinataire."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => receiveMut.mutate()}
              disabled={receiveMut.isPending}
            >
              {receiveMut.isPending ? "Enregistrement…" : "Confirmer la réception"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="r-receipt">N° accusé de réception (optionnel)</Label>
            <Input
              id="r-receipt"
              placeholder="Ex: AR-2026-0123"
              value={rReceipt}
              onChange={(e) => setRReceipt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-obs">Observations (optionnel)</Label>
            <Input
              id="r-obs"
              placeholder="Notes"
              value={rObs}
              onChange={(e) => setRObs(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
