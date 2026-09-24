import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input, Button } from "@/components/ui";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  delay = 300,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internal !== value) {
        onChange(internal);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [internal, delay, onChange, value]);

  return (
    <div className={`relative ${className || "flex-1 min-w-[240px]"}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internal && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setInternal("")}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
