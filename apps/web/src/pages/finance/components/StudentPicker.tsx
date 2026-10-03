import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, X, Check } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/api/students";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  enrollments?: Array<{
    id: string;
    academicYearId: string;
    class?: { id: string; name: string } | null;
    level?: { id: string; name: string } | null;
  }>;
}

interface Props {
  value?: Student | null;
  onChange: (student: Student | null) => void;
  disabled?: boolean;
  className?: string;
}

export function StudentPicker({ value, onChange, disabled, className }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["students-picker", debounced],
    queryFn: () =>
      studentsApi.list({ q: debounced || undefined, limit: 10 } as any),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  });

  const students: Student[] = Array.isArray(data)
    ? data
    : (data as any)?.items || (data as any)?.data || [];

  const handleSelect = (s: Student) => {
    onChange(s);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  // Si un élève est sélectionné, on l'affiche en "puce"
  if (value) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2",
          className,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {value.lastName} {value.firstName}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {value.matricule}
            </p>
          </div>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Changer d'élève"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un élève (nom, matricule)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          className="pl-9"
        />
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute z-30 mt-1 w-full bg-background border rounded-md shadow-lg max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Aucun élève trouvé
            </div>
          ) : (
            students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {s.lastName} {s.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {s.matricule}
                  </p>
                </div>
                <Check className="h-4 w-4 text-transparent" />
              </button>
            ))
          )}
        </div>
      )}

      {open && debounced.length < 2 && (
        <div className="absolute z-30 mt-1 w-full bg-background border rounded-md shadow-lg py-3 text-center text-xs text-muted-foreground">
          Tapez au moins 2 caractères
        </div>
      )}
    </div>
  );
}
