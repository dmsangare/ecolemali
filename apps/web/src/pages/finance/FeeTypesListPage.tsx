import { useState, useMemo } from "react";
import { Tag, Plus, Loader2, Pencil, Trash2, Search, AlertCircle } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useFeeTypes,
  useDeleteFeeType,
} from "@/hooks/finance";
import { FEE_CATEGORY_LABELS, type FeeType, type FeeCategory } from "@/types/finance";
import { CreateFeeTypeModal } from "./components/CreateFeeTypeModal";

export function FeeTypesListPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeeType | null>(null);

  const { data, isLoading } = useFeeTypes(
    categoryFilter ? { category: categoryFilter } : {},
  );
  const deleteMutation = useDeleteFeeType();

  const feeTypes = useMemo<FeeType[]>(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : ((data as any).data || []) as FeeType[];
  }, [data]);

  const filtered = useMemo<FeeType[]>(() => {
    if (!search.trim()) return feeTypes;
    const q = search.toLowerCase();
    return feeTypes.filter(
      (ft: FeeType) =>
        ft.name.toLowerCase().includes(q) ||
        ft.code.toLowerCase().includes(q),
    );
  }, [feeTypes, search]);

  const handleDelete = (ft: FeeType) => {
    if (
      window.confirm(
        `Supprimer "${ft.name}" ?\n\nAttention : si ce type est utilisé dans des factures ou grilles tarifaires, la suppression sera refusée.`,
      )
    ) {
      deleteMutation.mutate(ft.id);
    }
  };

  const handleEdit = (ft: FeeType) => {
    setEditTarget(ft);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Types de frais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {feeTypes.length} type(s) configuré(s)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau type
        </Button>
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">📁 Toutes les catégories</option>
          {Object.entries(FEE_CATEGORY_LABELS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.emoji} {info.label}
            </option>
          ))}
        </select>

        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un type (nom, code)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Tag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucun type de frais</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Créez votre premier type de frais
            </p>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium">Catégorie</th>
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Nom</th>
                    <th className="text-center p-3 font-medium">Utilisé dans</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ft: FeeType) => {
                    const info = FEE_CATEGORY_LABELS[ft.category] || FEE_CATEGORY_LABELS.AUTRE;
                    const usage =
                      (ft._count?.feeStructures || 0) + (ft._count?.invoiceItems || 0);

                    return (
                      <tr
                        key={ft.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="p-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
                              info.color,
                            )}
                          >
                            <span>{info.emoji}</span>
                            {info.label}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs">{ft.code}</td>
                        <td className="p-3 font-medium">{ft.name}</td>
                        <td className="p-3 text-center text-muted-foreground text-xs">
                          {usage > 0 ? (
                            <span>
                              {ft._count?.feeStructures || 0} tarif(s),{" "}
                              {ft._count?.invoiceItems || 0} facture(s)
                            </span>
                          ) : (
                            <span className="italic">Jamais utilisé</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs font-medium",
                              ft.isActive
                                ? "bg-green-500/10 text-green-700"
                                : "bg-gray-500/10 text-gray-700",
                            )}
                          >
                            {ft.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ft)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ft)}
                              disabled={usage > 0}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                              title={
                                usage > 0
                                  ? "Impossible de supprimer : utilisé ailleurs"
                                  : "Supprimer"
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INFO */}
      <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-3">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <div>
          <strong>Astuce :</strong> les types de frais sont indépendants des années scolaires.
          C'est dans la <strong>Grille tarifaire</strong> que vous définissez les montants
          par niveau et par année.
        </div>
      </div>

      {/* MODALE */}
      {modalOpen && (
        <CreateFeeTypeModal
          editFeeType={editTarget}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
