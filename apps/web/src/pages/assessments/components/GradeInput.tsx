import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GradeInputProps {
  value: string;
  maxScore: number;
  disabled?: boolean;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  "data-row"?: number;
  "data-col"?: number;
}

export const GradeInput = forwardRef<HTMLInputElement, GradeInputProps>(
  (
    { value, maxScore, disabled, onChange, onKeyDown, onBlur, ...rest },
    ref,
  ) => {
    const numValue = parseFloat(value);
    const isInvalid =
      value !== "" && (isNaN(numValue) || numValue < 0 || numValue > maxScore);

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          // Accepter que chiffres, point et virgule
          const cleaned = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
          onChange(cleaned);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="—"
        className={cn(
          "w-full h-10 px-2 text-center text-sm font-mono rounded-md border transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          isInvalid
            ? "border-destructive bg-destructive/5 text-destructive"
            : "border-input bg-background",
          disabled && "opacity-60 cursor-not-allowed bg-muted",
        )}
        {...rest}
      />
    );
  },
);
GradeInput.displayName = "GradeInput";
