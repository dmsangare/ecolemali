import { useState, useMemo } from "react";
import { X, MessageCircle, Loader2, Send } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/types/finance";

interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  relationType?: string;
}

interface Props {
  student: {
    firstName: string;
    lastName: string;
    matricule: string;
    guardians?: Array<{ guardian: Guardian }>;
  };
  schoolName: string;
  paymentAmount: number;
  paymentDate: string;
  receiptNumber?: string | null;
  invoiceNumber?: string | null;
  onClose: () => void;
}

/**
 * Normalise un numero malien :
 * - 76 12 34 56 → +223 76 12 34 56 (si format 8 chiffres)
 * - +223 76... → +22376123456
 * - 0022376... → +22376...
 */
function normalizePhone(raw: string): string {
  if (!raw) return "";
  let digits = raw.replace(/[^\d]/g, "");

  // Retirer prefixe 00223
  if (digits.startsWith("00223")) digits = digits.slice(5);
  // Retirer prefixe 223 si suivi de 8 chiffres
  if (digits.startsWith("223") && digits.length === 11) digits = digits.slice(3);

  // Si 8 chiffres (format malien standard)
  if (digits.length === 8) return `223${digits}`;
  // Si 11 chiffres commencant par 223
  if (digits.length === 11 && digits.startsWith("223")) return digits;

  return digits;
}

export function SendWhatsAppModal({
  student,
  schoolName,
  paymentAmount,
  paymentDate,
  receiptNumber,
  invoiceNumber,
  onClose,
}: Props) {
  const guardians = useMemo<Guardian[]>(() => {
    return (student.guardians || [])
      .map((g) => g.guardian)
      .filter((g): g is Guardian => !!g && !!g.phone);
  }, [student.guardians]);

  const [phone, setPhone] = useState(
    guardians.length > 0 ? guardians[0].phone : "",
  );
  const [message, setMessage] = useState(() => {
    const school = schoolName || "notre etablissement";
    const amount = formatFCFA(paymentAmount);
    const date = new Date(paymentDate).toLocaleDateString("fr-FR");
    const parent = guardians.length > 0 ? guardians[0].firstName : "Cher parent";
    return `Bonjour ${parent},\n\nNous confirmons la reception de votre paiement de ${amount} pour ${student.firstName} ${student.lastName} le ${date}.${receiptNumber ? `\n\nRecu N° : ${receiptNumber}` : ""}${invoiceNumber ? `\nFacture : ${invoiceNumber}` : ""}\n\nMerci de votre confiance.\n${school}`;
  });

  const normalizedPhone = normalizePhone(phone);
  const isValid = normalizedPhone.length >= 11;

  const handleSend = () => {
    if (!isValid) return;
    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Envoyer par WhatsApp</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recu de {formatFCFA(paymentAmount)} pour {student.firstName}{" "}
                {student.lastName}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CORPS */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* CHOIX TUTEUR */}
          {guardians.length > 0 && (
            <div>
              <Label className="text-sm font-medium">
                Choisir un tuteur
              </Label>
              <div className="mt-2 space-y-1.5">
                {guardians.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPhone(g.phone)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border-2 text-left text-sm transition-all",
                      phone === g.phone
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50",
                    )}
                  >
                    <div>
                      <span className="font-medium">
                        {g.lastName} {g.firstName}
                      </span>
                      {g.relationType && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({g.relationType})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {g.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NUMERO */}
          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Numero WhatsApp *
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+223 76 12 34 56"
              className="mt-1 font-mono"
            />
            {phone && (
              <p className="text-xs text-muted-foreground mt-1">
                Numero formate :{" "}
                <span className="font-mono text-green-600">
                  +{normalizedPhone}
                </span>
              </p>
            )}
          </div>

          {/* MESSAGE */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/2000
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!isValid}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Ouvrir WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
