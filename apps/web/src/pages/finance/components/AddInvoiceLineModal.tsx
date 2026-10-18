import { useState, useMemo } from "react";
import { X, Save, Tag, Lock, Unlock, AlertCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  FEE_CATEGORY_LABELS,
  formatFCFA,
  type FeeStructure,
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
  officialAmount?: number;
  isModified?: boolean;
  motif?: string;
}

interface Props {
  structures: FeeStructure[];
  editLine?: InvoiceLineDraft | null;
  onSave: (line: InvoiceLineDraft) => void;
  onClose: () => void;
}

const MOTIFS = [
  "Bourse",
  "Cas social",
  "Reduction famille",
  "Erreur de saisie",
  "Autre",
] as const;

export function AddInvoiceLineModal({
  structures,
  editLine,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!editLine;

  const availableStructures = useMemo(() => {
    return structures.filter((s) => s.feeType);
  }, [structures]);

  const [feeTypeId, setFeeTypeId] = useState(editLine?.feeTypeId || "");
  const [quantity, setQuantity] = useState(String(editLine?.quantity ?? 1));
  const [unitAmount, setUnitAmount] = useState(
    editLine ? String(editLine.unitAmount) : "",
  );
  const [isEditingPrice, setIsEditingPrice] = useState(
    editLine?.isModified ?? false,
  );
  const [motif, setMotif] = useState<string>(editLine?.motif || "");
  const [customMotif, setCustomMotif] = useState("");

  const selectedStructure = availableStructures.find(
    (s) => s.feeType?.id === feeTypeId,
  );
  const officialAmount = selectedStructure
    ? Number(selectedStructure.amount)
    : 0;

  const handleFeeTypeChange = (newFeeTypeId: string) => {
    setFeeTypeId(newFeeTypeId);
    const struct = availableStructures.find(
      (s) => s.feeType?.id === newFeeTypeId,
    );
    if (struct) {
      setUnitAmount(String(Number(struct.amount)));
    }
    setIsEditingPrice(false);
    setMotif("");
    setCustomMotif("");
  };

  const quantityNum = parseInt(quantity, 10) || 0;
  const unitAmountNum = parseInt(unitAmount, 10) || 0;
  const total = quantityNum * unitAmountNum;
  const priceModified = isEditingPrice && unitAmountNum !== officialAmount;

  const motifFilled =
    motif === "Autre" ? customMotif.trim().length > 0 : motif.trim().length > 0;

  const isValid =
    !!feeTypeId &&
    !!selectedStructure &&
    quantityNum > 0 &&
    unitAmountNum > 0 &&
    total > 0 &&
    (!priceModified || motifFilled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !selectedStructure?.feeType) return;

    const ft = selectedStructure.feeType;
    const motifText = priceModified
      ? motif === "Autre"
        ? "Modifie : " + customMotif.trim()
        : "Modifie : " + motif
      : "";

    onSave({
      feeTypeId: ft.id,
      feeTypeName: ft.name,
      feeTypeCode: ft.code,
      category: ft.category,
      description: motifText,
      quantity: quantityNum,
      unitAmount: unitAmountNum,
      officialAmount,
      isModified: priceModified,
      motif: priceModified ? motif : undefined,
    });
    onClose();
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
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isEdit ? "Modifier la ligne" : "Ajouter un frais"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Les prix proviennent de la grille tarifaire du niveau
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Type de frais *</Label>
              {availableStructures.length === 0 ? (
                <div className="py-4 mt-1 text-center text-sm text-muted-foreground border rounded-md border-dashed">
                  Aucun frais dans la grille tarifaire pour ce niveau.
                  <br />
                  Creez-en dans Finances, Grille tarifaire.
                </div>
              ) : (
                <select
                  value={feeTypeId}
                  onChange={(e) => handleFeeTypeChange(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                  disabled={isEdit}
                >
                  <option value="">-- Selectionner un frais --</option>
                  {availableStructures.map((s) => {
                    const ft = s.feeType!;
                    const info = FEE_CATEGORY_LABELS[ft.category];
                    return (
                      <option key={ft.id} value={ft.id}>
                        {info.emoji} {ft.name} - {formatFCFA(Number(s.amount))}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {selectedStructure && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantite *</Label>
                    <Input
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="mt-1 font-mono text-center"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unitAmount">Prix unitaire *</Label>
                      {!isEditingPrice ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(true)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Unlock className="h-3 w-3" />
                          Modifier
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPrice(false);
                            setUnitAmount(String(officialAmount));
                            setMotif("");
                            setCustomMotif("");
                          }}
                          className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                        >
                          <Lock className="h-3 w-3" />
                          Annuler
                        </button>
                      )}
                    </div>
                    <Input
                      id="unitAmount"
                      type="text"
                      inputMode="numeric"
                      value={unitAmount}
                      onChange={(e) =>
                        setUnitAmount(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      readOnly={!isEditingPrice}
                      className={cn(
                        "mt-1 font-mono text-right",
                        !isEditingPrice && "bg-muted/50 cursor-not-allowed",
                      )}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tarif officiel : {formatFCFA(officialAmount)}
                    </p>
                  </div>
                </div>

                {priceModified && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          Montant modifié - motif obligatoire
                        </p>
                        <p className="text-xs text-orange-700 mt-0.5">
                          Ecart : {formatFCFA(unitAmountNum - officialAmount)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Motif *</Label>
                      <select
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        required
                      >
                        <option value="">-- Selectionner un motif --</option>
                        {MOTIFS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {motif === "Autre" && (
                      <div>
                        <Label className="text-xs">Precisez le motif *</Label>
                        <Input
                          value={customMotif}
                          onChange={(e) => setCustomMotif(e.target.value)}
                          placeholder="Ex: Enfant du personnel enseignant"
                          className="mt-1"
                          maxLength={100}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

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
