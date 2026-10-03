import { useState, useMemo } from "react";
import { X, Loader2, Save, Tag } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useFeeTypes } from "@/hooks/finance";
import {
  FEE_CATEGORY_LABELS,
  formatFCFA,
  type FeeType,
  type FeeCategory,
} from "@/types/finance";

export interface InvoiceLineDraft {
  feeTypeId: string;
  feeTypeName: string;
  feeTypeCode: string;
  category: FeeCategory;
  description: string;
  quantity: number;
  unitAmount: number;
}

interface Props {
  editLine?: InvoiceLineDraft | null;
  defaultFeeTypeId?: string;
  onSave: (line: InvoiceLineDraft) => void;
  onClose: () => void;
}

export function AddInvoiceLineModal({
  editLine,
  defaultFeeTypeId,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!editLine;

  const { data: feeTypesData, isLoading: loadingTypes } = useFeeTypes();
  const feeTypes = useMemo<FeeType[]>(() => {
    if (!feeTypesData) return [];
    const list = Array.isArray(feeTypesData)
      ? feeTypesData
      : (feeTypesData as any).data || [];
    return list.filter((ft: FeeType) => ft.isActive);
  }, [feeTypesData]);

  const [feeTypeId, setFeeTypeId] = useState(
    editLine?.feeTypeId || defaultFeeTypeId || "",
  );
  const [description, setDescription] = useState(editLine?.description || "");
  const [quantity, setQuantity] = useState(String(editLine?.quantity ?? 1));
  const [unitAmount, setUnitAmount] = useState(
    editLine ? String(editLine.unitAmount) : "",
  );

  // Frais courant
  const selectedFeeType = feeTypes.find((ft) => ft.id === feeTypeId);

  // Totaux
  const quantityNum = parseInt(quantity, 10) || 0;
  const unitAmountNum = parseInt(unitAmount, 10) || 0;
  const total = quantityNum * unitAmountNum;

  const isValid =
    feeTypeId && quantityNum > 0 && unitAmountNum >= 0 && total > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !selectedFeeType) return;

    onSave({
      feeTypeId: selectedFeeType.id,
      feeTypeName: selectedFeeType.name,
      feeTypeCode: selectedFeeType.code,
      category: selectedFeeType.category,
      description: description.trim(),
      quantity: quantityNum,
      unitAmount: unitAmountNum,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
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
                  {isEdit ? "Modifier la ligne" : "Ajouter un frais"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isEdit
                    ? "Modifier les informations de cette ligne"
                    : "Sélectionner un frais et préciser le montant"}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CORPS */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* FRAIS */}
            <div>
              <Label>Type de frais *</Label>
              {loadingTypes ? (
                <div className="flex items-center justify-center py-4 mt-1 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : feeTypes.length === 0 ? (
                <div className="py-4 mt-1 text-center text-sm text-muted-foreground border rounded-md border-dashed">
                  Aucun type de frais actif. Créez-en dans Finances → Types de frais.
                </div>
              ) : (
                <select
                  value={feeTypeId}
                  onChange={(e) => setFeeTypeId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                  disabled={isEdit}
                >
                  <option value="">-- Sélectionner un frais --</option>
                  {feeTypes.map((ft) => {
                    const info = FEE_CATEGORY_LABELS[ft.category];
                    return (
                      <option key={ft.id} value={ft.id}>
                        {info.emoji} {ft.name} ({ft.code})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <Label htmlFor="description">
                Description (optionnel)
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Bourse partielle accordée par le promoteur"
                className="mt-1"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Précision visible sur la facture
              </p>
            </div>

            {/* QTE + MONTANT */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="mt-1 font-mono text-center"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitAmount">Prix unitaire (FCFA) *</Label>
                <Input
                  id="unitAmount"
                  type="text"
                  inputMode="numeric"
                  value={unitAmount}
                  onChange={(e) =>
                    setUnitAmount(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="Ex: 10000"
                  className="mt-1 font-mono text-right"
                  required
                />
              </div>
            </div>

            {/* TOTAL */}
            {total > 0 && (
              <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total ligne
                </span>
                <span className="text-lg font-bold font-mono">
                  {formatFCFA(total)}
                </span>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid}>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Enregistrer" : "Ajouter la ligne"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
