import { useState, useMemo } from "react";
import { X, Loader2, Save, TrendingDown } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useCreateExpense, useCurrentCashSession } from "@/hooks/finance";
import { formatFCFA } from "@/types/finance";
import type { ExpenseCategory } from "@/types/finance";

interface Props {
  onClose: () => void;
}

export function CreateExpenseModal({ onClose }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [spentAt, setSpentAt] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const createMutation = useCreateExpense();
  const { data: currentSession } = useCurrentCashSession();

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["expense-categories", "list"],
    queryFn: async () => {
      const { data } = await api.get("/expense-categories");
      return (data.data || data) as ExpenseCategory[];
    },
    staleTime: 5 * 60_000,
  });

  const categories = useMemo<ExpenseCategory[]>(() => {
    if (!categoriesData) return [];
    return Array.isArray(categoriesData) ? categoriesData : [];
  }, [categoriesData]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const amountNum = parseInt(amount, 10) || 0;

  const isValid =
    categoryId.length > 0 &&
    amountNum > 0 &&
    description.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await createMutation.mutateAsync({
        categoryId,
        amount: amountNum,
        description: description.trim(),
        beneficiary: beneficiary.trim() || undefined,
        spentAt: spentAt ? new Date(spentAt).toISOString() : undefined,
        cashSessionId: (currentSession as any)?.id || undefined,
      });
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Nouvelle depense</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Enregistrer une sortie de caisse
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Categorie *</Label>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-4 mt-1 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="py-4 mt-1 text-center text-sm text-muted-foreground border rounded-md border-dashed">
                  Aucune categorie disponible.
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">-- Selectionner une categorie --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji || "X"} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Ex: 15000"
                className="mt-1 font-mono text-lg font-bold text-right"
                required
              />
              {amountNum > 0 && (
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formatFCFA(amountNum)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Achat craies et cahiers pour 6eme A"
                className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500
              </p>
            </div>

            <div>
              <Label htmlFor="beneficiary">Beneficiaire (optionnel)</Label>
              <Input
                id="beneficiary"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Ex: Librairie du marche"
                className="mt-1"
                maxLength={150}
              />
            </div>

            <div>
              <Label htmlFor="spentAt">Date de la depense</Label>
              <Input
                id="spentAt"
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                className="mt-1"
              />
            </div>

            {selectedCategory && amountNum > 0 && (
              <div className="rounded-lg bg-muted/50 border px-4 py-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categorie</span>
                  <span className="font-medium">
                    {selectedCategory.emoji} {selectedCategory.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold font-mono text-red-600">
                    -{formatFCFA(amountNum)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer la depense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
