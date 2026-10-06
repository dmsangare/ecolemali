import { useState } from "react";
import { X, Loader2, Save, Tag } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCreateFeeType, useUpdateFeeType } from "@/hooks/finance";
import {
  FEE_CATEGORY_LABELS,
  type FeeCategory,
  type FeeType,
} from "@/types/finance";

interface Props {
  editFeeType?: FeeType | null;
  onClose: () => void;
}

const CATEGORIES: FeeCategory[] = [
  "INSCRIPTION",
  "SCOLARITE",
  "CANTINE",
  "TRANSPORT",
  "UNIFORME",
  "FOURNITURES",
  "EXAMEN",
  "AUTRE",
];

export function CreateFeeTypeModal({ editFeeType, onClose }: Props) {
  const isEdit = !!editFeeType;

  const [code, setCode] = useState(editFeeType?.code || "");
  const [name, setName] = useState(editFeeType?.name || "");
  const [category, setCategory] = useState<FeeCategory>(
    editFeeType?.category || "SCOLARITE",
  );
  const [isActive, setIsActive] = useState(editFeeType?.isActive ?? true);

  const createMutation = useCreateFeeType();
  const updateMutation = useUpdateFeeType();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const formValid = code.trim().length >= 1 && name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const input = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      isActive,
    };

    try {
      if (isEdit && editFeeType) {
        await updateMutation.mutateAsync({ id: editFeeType.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isEdit ? "Modifier le type de frais" : "Nouveau type de frais"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isEdit ? "Modifier les informations" : "Ajouter un frais à facturer"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CORPS */}
          <div className="p-6 space-y-4">
            {/* CODE + NOM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SCO"
                  className="mt-1 font-mono uppercase"
                  maxLength={10}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nom du frais</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Frais de scolarité"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* CATEGORIE */}
            <div>
              <Label className="mb-2 block">Catégorie</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const info = FEE_CATEGORY_LABELS[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-input hover:border-primary/50",
                      )}
                    >
                      <span className="text-lg">{info.emoji}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATUT */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">
                Actif (visible dans la grille tarifaire)
              </span>
            </label>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!formValid || isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
