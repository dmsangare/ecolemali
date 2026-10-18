import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
  X, Loader2, ArrowLeft, Users, AlertTriangle, Trash2,
  ChevronDown, ChevronRight, Filter, Eye,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/axios";
import { toast } from "sonner";

interface PreviewRow {
  lineNumber: number;
  data: any | null;
  errors: string[];
}

interface PreviewResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  doublonCount: number;
  classesTrouvees: string[];
  elevesParClasse: Record<string, number>;
  rows: PreviewRow[];
  doublons: Array<{ lineNumber: number; raison: string; nom: string }>;
}

interface ConfirmResult {
  created: number;
  classesCreated: number;
  guardiansCreated: number;
  errors: Array<{ nom: string; error: string }>;
}

export function ImportStudentsPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rowFilter, setRowFilter] = useState<"all" | "valid" | "error">("all");
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ============================================================
  // UPLOAD + APERCU
  // ============================================================
  const handleFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Format invalide. Utilisez un fichier Excel (.xlsx)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setFile(f);
    setPreview(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", f);
      const { data } = await api.post("/students/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data.data || data);
      toast.success("Fichier analyse avec succes");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ============================================================
  // CONFIRMATION
  // ============================================================
  const handleConfirm = async () => {
    if (!preview) return;
    const students = preview.rows
      .filter((r) => r.data !== null)
      .map((r) => r.data);

    if (students.length === 0) {
      toast.error("Aucun élève valide a importer");
      return;
    }

    setConfirming(true);
    try {
      const { data } = await api.post("/students/import/confirm", { students });
      setResult(data.data || data);
      toast.success(`${(data.data || data).created} eleve(s) importe(s)`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <button
          onClick={() => navigate("/students")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux eleves
        </button>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Importer des élèves depuis Excel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importez votre liste d'eleves existante en 3 etapes
        </p>
      </div>

      {/* ETAPE 1 : TELECHARGER LE MODELE */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-medium">Etape 1 — Telecharger le modele Excel</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Remplissez le modele avec la liste de vos eleves
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/eleves-template.xlsx" download>
              <Download className="h-4 w-4 mr-2" />
              Telecharger le modele
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* ETAPE 2 : UPLOAD */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="font-medium">Etape 2 — Charger le fichier rempli</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Glissez le fichier ou cliquez pour le selectionner
            </p>
          </div>

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-primary/50",
              )}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Glissez votre fichier Excel ici</p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquez pour parcourir
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Format accepte : .xlsx — Taille max : 10 Mo
              </p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} Ko
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={loading || confirming}
                  title="Effacer le fichier"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
              <div>
                <p className="font-medium text-primary">
                  Analyse du fichier en cours...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cela peut prendre jusqu'a 1 minute selon la taille du fichier.
                  Ne fermez pas cette page.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ETAPE 3 : APERCU */}
      {preview && !result && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-medium">Etape 3 — Vérifier l'apercu</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Verifiez les donnees avant de valider l'import
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total lignes</p>
                <p className="text-xl font-bold">{preview.totalRows}</p>
              </div>
              <div className="border rounded-lg p-3 bg-green-50">
                <p className="text-xs text-green-700">Valides</p>
                <p className="text-xl font-bold text-green-700">{preview.validCount}</p>
              </div>
              <div className="border rounded-lg p-3 bg-orange-50">
                <p className="text-xs text-orange-700">Doublons</p>
                <p className="text-xl font-bold text-orange-700">{preview.doublonCount}</p>
              </div>
              <div className="border rounded-lg p-3 bg-red-50">
                <p className="text-xs text-red-700">Erreurs</p>
                <p className="text-xl font-bold text-red-700">{preview.errorCount}</p>
              </div>
            </div>

            {/* CLASSES */}
            {preview.classesTrouvees.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="font-medium text-sm">Classes detectees ({preview.classesTrouvees.length})</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.elevesParClasse).map(([classe, count]) => (
                    <span key={classe} className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                      {classe} · {count} eleve{count > 1 ? "s" : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* APERCU DETAILLE */}
            <div className="border rounded-lg overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu des élèves detectes
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={rowFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRowFilter("all")}
                    >
                      Tous ({preview.totalRows})
                    </Button>
                    <Button
                      variant={rowFilter === "valid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRowFilter("valid")}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Valides ({preview.validCount})
                    </Button>
                    <Button
                      variant={rowFilter === "error" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRowFilter("error")}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Erreurs ({preview.errorCount})
                    </Button>
                  </div>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium text-xs w-16">Ligne</th>
                      <th className="px-3 py-2 font-medium text-xs">Nom Prenom</th>
                      <th className="px-3 py-2 font-medium text-xs w-16">Sexe</th>
                      <th className="px-3 py-2 font-medium text-xs w-28">Naissance</th>
                      <th className="px-3 py-2 font-medium text-xs">Classe</th>
                      <th className="px-3 py-2 font-medium text-xs w-24">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows
                      .filter((r) => {
                        if (rowFilter === "valid") return r.errors.length === 0;
                        if (rowFilter === "error") return r.errors.length > 0;
                        return true;
                      })
                      .map((r) => {
                        const hasError = r.errors.length > 0;
                        const d = r.data || {};
                        return (
                          <tr
                            key={r.lineNumber}
                            className={cn(
                              "border-t",
                              hasError ? "bg-red-50/50" : "hover:bg-muted/20",
                            )}
                          >
                            <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                              {r.lineNumber}
                            </td>
                            <td className="px-3 py-2">
                              {d.lastName || d.firstName ? (
                                <span className="font-medium">
                                  {d.lastName || "?"} {d.firstName || "?"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  (vide)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {d.gender ? (
                                <span
                                  className={cn(
                                    "inline-block px-1.5 py-0.5 rounded text-xs font-medium",
                                    d.gender === "M"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-pink-100 text-pink-700",
                                  )}
                                >
                                  {d.gender}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {d.birthDate || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {d.className || d.classe || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <span
                                  className="inline-flex items-center gap-1 text-xs text-red-700 font-medium"
                                  title={r.errors.join("\n")}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {r.errors.length} err.
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                  <CheckCircle2 className="h-3 w-3" />
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {preview.rows.filter((r) => {
                  if (rowFilter === "valid") return r.errors.length === 0;
                  if (rowFilter === "error") return r.errors.length > 0;
                  return true;
                }).length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Aucune ligne a afficher pour ce filtre
                  </div>
                )}
              </div>
            </div>

            {/* ERREURS */}
            {preview.errorCount > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {preview.errorCount} ligne(s) avec erreur
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                  {preview.rows
                    .filter((r) => r.errors.length > 0)
                    .slice(0, 20)
                    .map((r) => (
                      <div key={r.lineNumber} className="text-red-700">
                        <strong>Ligne {r.lineNumber}</strong> : {r.errors.join(", ")}
                      </div>
                    ))}
                  {preview.errorCount > 20 && (
                    <p className="text-xs text-red-600 italic">
                      ... et {preview.errorCount - 20} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* DOUBLONS */}
            {preview.doublonCount > 0 && (
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-orange-800 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {preview.doublonCount} doublon(s) rejete(s)
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 text-sm text-orange-700">
                  {preview.doublons.slice(0, 10).map((d, i) => (
                    <div key={i}>
                      <strong>Ligne {d.lineNumber}</strong> : {d.nom} — {d.raison}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset} disabled={confirming}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirming || preview.validCount === 0}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Importer {preview.validCount} eleve{preview.validCount > 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTAT */}
      {result && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="h-10 w-10" />
              <div>
                <p className="font-semibold text-lg">Import termine</p>
                <p className="text-sm text-muted-foreground">
                  {result.created} eleve(s) cree(s) · {result.classesCreated} classe(s) creee(s) · {result.guardiansCreated} tuteur(s) cree(s)
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-red-800">{result.errors.length} erreur(s)</p>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm text-red-700">
                  {result.errors.map((e, i) => (
                    <div key={i}>
                      <strong>{e.nom}</strong> : {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Importer un autre fichier
              </Button>
              <Button onClick={() => navigate("/students")}>
                <Users className="h-4 w-4 mr-2" />
                Voir la liste des eleves
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
