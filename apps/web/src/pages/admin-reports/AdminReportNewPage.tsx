import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminReportsApi, REPORT_CATEGORY_LABELS } from "@/api/admin-reports";
import { academicYearsApi } from "@/api/academic-years";
import { useAuth } from "@/contexts/AuthContext";

export function AdminReportNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:create");

  const [templateCode, setTemplateCode] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [referenceDate, setReferenceDate] = useState("");

  // --- Templates ---
  const templatesQ = useQuery({
    queryKey: ["admin-reports", "templates"],
    queryFn: () => adminReportsApi.listTemplates(),
  });

  // --- Années scolaires ---
  const yearsQ = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: () => academicYearsApi.list(),
  });

  const templates = templatesQ.data ?? [];
  const years = yearsQ.data ?? [];
  const currentYear = years.find((y) => y.isCurrent);
  const selectedTemplate = templates.find((t) => t.code === templateCode);

  // --- Pré-sélection année courante ---
  if (currentYear && !academicYearId) {
    setAcademicYearId(currentYear.id);
  }

  // --- Création ---
  const createMut = useMutation({
    mutationFn: async () => {
      const report = await adminReportsApi.createReport({
        templateCode: templateCode!,
        academicYearId: academicYearId ?? undefined,
        periodLabel: periodLabel || undefined,
        referenceDate: referenceDate || undefined,
      });
      // Auto-generate pour pre-remplir
      try {
        await adminReportsApi.generateReport(report.id);
      } catch {
        // si generate echoue, on continue avec un rapport vide
      }
      return report;
    },
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      navigate(`/admin-reports/${report.id}`);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? err?.message ?? "Erreur lors de la création");
    },
  });

  if (!canManage) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Vous n'avez pas la permission de créer un rapport.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link to="/admin-reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nouveau rapport</h1>
            <p className="text-sm text-muted-foreground">
              Choisissez un modèle et une année scolaire
            </p>
          </div>
        </div>
      </div>

      {/* Étape 1 : modèle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1. Choisissez un modèle de rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templatesQ.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement…</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                Aucun modèle disponible.
              </p>
              <Link to="/admin-reports">
                <Button variant="outline" size="sm">
                  Retour à la liste pour initialiser
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateCode(t.code)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    templateCode === t.code
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {t.code}
                        </span>
                        {templateCode === t.code && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="font-medium mt-1">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {REPORT_CATEGORY_LABELS[t.category] ?? t.category}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Étape 2 : année */}
      {templateCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Année scolaire</CardTitle>
          </CardHeader>
          <CardContent>
            {yearsQ.isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Chargement…</div>
            ) : years.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune année scolaire disponible.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-3">
                {years.map((y) => {
                  const label = `${new Date(y.startDate).getFullYear()}-${new Date(y.endDate).getFullYear()}`;
                  return (
                    <button
                      key={y.id}
                      type="button"
                      onClick={() => setAcademicYearId(y.id)}
                      className={`rounded-lg border p-3 text-center transition-colors ${
                        academicYearId === y.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      {y.isCurrent && (
                        <div className="text-xs text-primary mt-1">En cours</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Étape 3 : détails optionnels */}
      {templateCode && academicYearId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Détails (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodLabel">Période</Label>
              <Input
                id="periodLabel"
                placeholder="Ex: 1er trimestre 2026"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceDate">Date de référence</Label>
              <Input
                id="referenceDate"
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Date à laquelle les effectifs sont comptés (par défaut : aujourd'hui)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Link to="/admin-reports">
          <Button variant="ghost">Annuler</Button>
        </Link>
        <Button
          onClick={() => createMut.mutate()}
          disabled={!templateCode || !academicYearId || createMut.isPending}
        >
          {createMut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création…
            </>
          ) : (
            <>Créer et pré-remplir</>
          )}
        </Button>
      </div>

      {selectedTemplate && (
        <p className="text-xs text-muted-foreground text-center">
          Le rapport sera créé en <strong>brouillon</strong> et pré-rempli automatiquement
          avec les données de l'école.
        </p>
      )}
    </div>
  );
}
