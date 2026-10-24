import { useState } from "react";
import { Calculator, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  useReportCards,
  useValidateReportCard,
  usePublishReportCard,
} from "@/hooks/report-cards";
import { cn } from "@/lib/utils";

export function CalculationPage() {
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: classes } = useClasses();
  const { data: terms } = useQuery({
    queryKey: ["terms", termId ? "all" : "all"],
    queryFn: async () => {
      const res = await api.get("/terms");
      return res.data;
    },
    enabled: true,
  });
  const { data: reportCards, isLoading, refetch } = useReportCards({ classId, termId });
  const validate = useValidateReportCard();
  const publish = usePublishReportCard();

  const cards = reportCards ?? [];
  const draftCards = cards.filter((c: any) => c.status === "DRAFT");
  const validatedCards = cards.filter((c: any) => c.status === "VALIDATED");
  const publishedCards = cards.filter((c: any) => c.status === "PUBLISHED");

  const handleValidateAll = async () => {
    if (draftCards.length === 0) return;
    setMessage(null);
    try {
      for (const card of draftCards) {
        await validate.mutateAsync(card.id);
      }
      setMessage({ type: "success", text: `${draftCards.length} bulletin(s) validé(s)` });
      refetch();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const handlePublishAll = async () => {
    if (validatedCards.length === 0) return;
    setMessage(null);
    try {
      for (const card of validatedCards) {
        await publish.mutateAsync(card.id);
      }
      setMessage({ type: "success", text: `${validatedCards.length} bulletin(s) publié(s)` });
      refetch();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Calcul & vérification
        </h1>
        <p className="text-slate-500 mt-1">
          Calculer les moyennes, valider et publier les bulletins d'une classe.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Classe</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Sélectionner une classe</option>
                {(classes ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Période</label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Sélectionner une période</option>
                {(terms ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div className={cn(
              "rounded-lg p-3 text-sm flex items-center gap-2",
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            )}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {classId && termId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Brouillons</p>
                <p className="text-2xl font-bold">{draftCards.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Validés</p>
                <p className="text-2xl font-bold text-blue-600">{validatedCards.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Publiés</p>
                <p className="text-2xl font-bold text-green-600">{publishedCards.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleValidateAll} disabled={draftCards.length === 0 || validate.isPending}>
              {validate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Valider tout ({draftCards.length})
            </Button>
            <Button onClick={handlePublishAll} disabled={validatedCards.length === 0 || publish.isPending}>
              {publish.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Publier tout ({validatedCards.length})
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Bulletins ({cards.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Élève</th>
                      <th className="text-right py-2">Moyenne</th>
                      <th className="text-center py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((c: any) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2">{c.student?.lastName} {c.student?.firstName}</td>
                        <td className="text-right">{c.average ?? "—"} / {c.scale}</td>
                        <td className="text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            c.status === "DRAFT" && "bg-slate-100 text-slate-700",
                            c.status === "VALIDATED" && "bg-blue-100 text-blue-700",
                            c.status === "PUBLISHED" && "bg-green-100 text-green-700"
                          )}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
