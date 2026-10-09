import { useState, useEffect } from "react";
import { Hash, Loader2, Check, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useSettings } from "@/hooks/settings/useSettings";
import { settingsApi } from "@/api/settings";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DEFAULT_INVOICE_PREFIX = "FAC";
const DEFAULT_RECEIPT_PREFIX = "REC";
const PREFIX_REGEX = /^[A-Z0-9]{2,5}$/;

function sanitize(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export function NumberingTab() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();

  const savedInvoice = settings?.data?.numbering?.invoicePrefix ?? DEFAULT_INVOICE_PREFIX;
  const savedReceipt = settings?.data?.numbering?.receiptPrefix ?? DEFAULT_RECEIPT_PREFIX;

  const [invoicePrefix, setInvoicePrefix] = useState(savedInvoice);
  const [receiptPrefix, setReceiptPrefix] = useState(savedReceipt);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInvoicePrefix(savedInvoice);
    setReceiptPrefix(savedReceipt);
  }, [savedInvoice, savedReceipt]);

  const hasChanges =
    invoicePrefix !== savedInvoice || receiptPrefix !== savedReceipt;
  const isValid =
    PREFIX_REGEX.test(invoicePrefix) && PREFIX_REGEX.test(receiptPrefix);

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const current = settings?.data ?? {};
      const merged = {
        ...current,
        numbering: {
          ...(current.numbering ?? {}),
          invoicePrefix,
          receiptPrefix,
        },
      };
      await settingsApi.update({ data: merged } as any);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Numerotation enregistree");
    } catch {
      toast.error("Impossible d'enregistrer");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-blue-900">Numerotation</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Personnalisez les prefixes des numeros de factures et de recus.
                Format : <strong>PREFIXE-ANNEE-NUMERO</strong> (ex. FAC-2026-000123).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-5 w-5 text-primary" />
            Prefixes personnalises
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            2 a 5 caracteres, lettres majuscules et chiffres uniquement.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prefixe factures</Label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(sanitize(e.target.value))}
                placeholder="FAC"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Exemple : <span className="font-mono">{invoicePrefix || "???"}-{year}-000123</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Prefixe recus</Label>
              <Input
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(sanitize(e.target.value))}
                placeholder="REC"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Exemple : <span className="font-mono">{receiptPrefix || "???"}-{year}-000123</span>
              </p>
            </div>
          </div>

          {!isValid && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              Chaque prefixe doit contenir 2 a 5 caracteres (A-Z, 0-9).
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || !isValid || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
