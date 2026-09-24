import { ReactNode, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmer l action",
  description = "Cette action ne peut pas etre annulee.",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  icon,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            variant === "danger" ? "bg-red-500/10" : "bg-orange-500/10"
          }`}
        >
          {icon || (
            <AlertTriangle
              className={`h-6 w-6 ${
                variant === "danger" ? "text-red-600" : "text-orange-600"
              }`}
            />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
