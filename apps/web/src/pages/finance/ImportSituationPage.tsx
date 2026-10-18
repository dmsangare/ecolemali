import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  X, Loader2, ArrowLeft, FileWarning, AlertTriangle,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/axios";
import { toast } from "sonner";

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
  status?: string;
}

interface RowDiagnostic {
  lineNumber: number;
  matricule: string;
  status: "OK" | "STUDENT_NOT_FOUND" | "ALREADY_INVOICED" | "INVALID";
  message?: string;
}

interface PreviewResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  skippedAlreadyInvoiced: number;
  rows: any[];
  errors: Array<{ lineNumber: number; matricule?: string; errors: string[] }>;
  rowDiagnostics: RowDiagnostic[];
}

interface ConfirmResult {
  createdInvoices: number;
  createdPayments: number;
  totalInvoiced: number;
  totalPaid: number;
  importTag: string;
}

export function ImportSituationPage() {
  const [academicYearId, setAcademicYearId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Année scolaire : on charge la liste et on prend la courante
  const { data: academicYears } = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return (data.data || data) as AcademicYear[];
    },
    staleTime: 10 * 60_000,
  });

  if (academicYears && !academicYearId) {
    const cur =
      academicYears.find((y) => y.isCurrent) || academicYears[0];
    if (cur) setAcademicYearId(cur.id);
  }

  // ============================================================
  // TELECHARGEMENT DU TEMPLATE
  // ============================================================
  const handleDownloadTemplate = async () => {
    if (!academicYearId) {
      toast.error("Selectionnez une année scolaire");
      return;
    }
    setDownloading(true);
    try {
      const response = await api.get(
        `/invoices/import-situation/template?academicYearId=${academicYearId}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "situation-import.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template telecharge");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // UPLOAD + PREVIEW
  // ============================================================
  const handleFile = useCallback(
    async (f: File) => {
      if (!f.name.match(/\.(xlsx|xls)$/i)) {
        toast.error("Format invalide. Utilisez un fichier Excel (.xlsx)");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux (max 10 Mo)");
        return;
      }
      if (!academicYearId) {
        toast.error("Selectionnez d'abord une année scolaire");
        return;
      }

      setFile(f);
      setPreview(null);
      setResult(null);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", f);
        const { data } = await api.post(
          `/invoices/import-situation/preview?academicYearId=${academicYearId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setPreview(data.data || data);
        toast.success("Fichier analyse");
      } catch (err) {
        toast.error(getErrorMessage(err));
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [academicYearId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  // ============================================================
  // CONFIRMATION
  // ============================================================
  const handleConfirm = async () => {
    if (!file || !academicYearId) return;
    setConfirming(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(
        `/invoices/import-situation/confirm?academicYearId=${academicYearId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(data.data || data);
      toast.success("Import reussi");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  // ============================================================
  // FILTRAGE DES DIAGNOSTICS POUR L'AFFICHAGE
  // ============================================================
  const blockingErrors = preview
    ? preview.rowDiagnostics.filter(
        (d) => d.status === "STUDENT_NOT_FOUND" || d.status === "INVALID",
      )
    : [];
  const canConfirm = preview && blockingErrors.length === 0 && !result;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* En-tete */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importer une situation
          </h1>
          <p className="text-sm text-muted-foreground">
            Importez l'etat des paiements existants (cahier papier) dans l'application.
          </p>
        </div>
      </div>

      {/* Etape 1 : Année + template */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h2 className="font-semibold">Telecharger le template</h2>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground block mb-1">
                Année scolaire
              </label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {academicYears?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                    {y.isCurrent ? " (en cours)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              disabled={downloading || !academicYearId}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Telecharger le template
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3 space-y-1">
            <p>Le template contient 3 onglets :</p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li><strong>SITUATION</strong> : 1 ligne par élève (pre-remplie)</li>
              <li><strong>INSTRUCTIONS</strong> : mode d'emploi detaille</li>
              <li><strong>EXEMPLE</strong> : 3 lignes de demonstration</li>
            </ul>
            <p className="mt-2">
              Les élèves ayant deja une facture seront ignores automatiquement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Etape 2 : Upload */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h2 className="font-semibold">Uploader le fichier rempli</h2>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              !academicYearId && "opacity-50 pointer-events-none",
            )}
          >
            {!file ? (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">
                  Glissez-deposez votre fichier Excel ici
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  ou cliquez pour selectionner (.xlsx, max 10 Mo)
                </p>
                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleInput}
                    className="hidden"
                  />
                  <Button asChild variant="outline" size="sm">
                    <span>Parcourir</span>
                  </Button>
                </label>
              </>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={loading || confirming}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse du fichier...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Etape 3 : Preview */}
      {preview && !result && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h2 className="font-semibold">Verification avant import</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Lignes</div>
                <div className="text-lg font-bold">{preview.totalRows}</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="text-xs text-muted-foreground">A importer</div>
                <div className="text-lg font-bold text-green-600">
                  {preview.validCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <div className="text-xs text-muted-foreground">Deja factures</div>
                <div className="text-lg font-bold text-blue-600">
                  {preview.skippedAlreadyInvoiced}
                </div>
              </div>
              <div
                className={cn(
                  "p-3 rounded-lg",
                  preview.errorCount > 0 ? "bg-red-500/10" : "bg-muted/50",
                )}
              >
                <div className="text-xs text-muted-foreground">Erreurs</div>
                <div
                  className={cn(
                    "text-lg font-bold",
                    preview.errorCount > 0 && "text-red-600",
                  )}
                >
                  {preview.errorCount}
                </div>
              </div>
            </div>

            {/* Erreurs bloquantes */}
            {blockingErrors.length > 0 && (
              <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-700 text-sm">
                    {blockingErrors.length} ligne(s) bloquante(s) — corrigez
                    avant d'importer
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                  {blockingErrors.map((e, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Ligne {e.lineNumber} :
                      </span>
                      <span className="font-mono">{e.matricule}</span>
                      <span className="text-red-700">
                        {e.status === "STUDENT_NOT_FOUND"
                          ? "Eleve introuvable"
                          : e.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lignes skip */}
            {preview.skippedAlreadyInvoiced > 0 && (
              <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span>
                    {preview.skippedAlreadyInvoiced} eleve(s) ignore(s) :
                    facture deja existante pour cette annee.
                  </span>
                </div>
              </div>
            )}

            {/* Bouton de confirmation */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={reset} disabled={confirming}>
                Annuler
              </Button>
              <Button onClick={handleConfirm} disabled={!canConfirm || confirming}>
                {confirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmer l'import
              </Button>
            </div>

            {!canConfirm && blockingErrors.length > 0 && (
              <p className="text-xs text-red-600 text-right">
                Corrigez les erreurs et re-uploadez le fichier.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Etape 4 : Resultat */}
      {result && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="font-semibold text-lg">Import reussi</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="text-xs text-muted-foreground">Factures creees</div>
                <div className="text-lg font-bold text-green-600">
                  {result.createdInvoices}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="text-xs text-muted-foreground">Paiements</div>
                <div className="text-lg font-bold text-green-600">
                  {result.createdPayments}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Total facture</div>
                <div className="text-sm font-bold font-mono">
                  {result.totalInvoiced.toLocaleString("fr-FR")} F
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Total encaisse</div>
                <div className="text-sm font-bold font-mono">
                  {result.totalPaid.toLocaleString("fr-FR")} F
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
              <div className="flex items-center gap-2">
                <FileWarning className="h-3.5 w-3.5" />
                <span>Trace d'import : <code className="font-mono">{result.importTag}</code></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={reset}>
                Importer un autre fichier
              </Button>
              <Button asChild>
                <Link to="/invoices">Voir les factures</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
