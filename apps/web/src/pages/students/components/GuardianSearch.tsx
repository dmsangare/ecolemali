import { useState } from "react";
import { Search, UserPlus, Check, Loader2, Phone } from "lucide-react";
import { Input, Button, Label } from "@/components/ui";
import { useGuardiansSearch, type Guardian } from "@/hooks/guardians";
import { StatusBadge } from "@/components/shared";
import { initials } from "@/lib/formatters";

interface GuardianSearchProps {
  label: string;
  relationType: "FATHER" | "MOTHER" | "TUTOR";
  selected: Guardian | null;
  onSelect: (guardian: Guardian) => void;
  onClear: () => void;
  onCreateNew: () => void;
}

export function GuardianSearch({
  label,
  relationType,
  selected,
  onSelect,
  onClear,
  onCreateNew,
}: GuardianSearchProps) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useGuardiansSearch(query);

  if (selected) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
              {initials(selected.firstName, selected.lastName)}
            </div>
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                {selected.lastName} {selected.firstName}
                <StatusBadge
                  label={
                    selected.relationType === "FATHER"
                      ? "Père"
                      : selected.relationType === "MOTHER"
                      ? "Mère"
                      : "Tuteur"
                  }
                  variant="success"
                />
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />
                {selected.phone}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Changer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou telephone..."
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.length >= 2 && (
        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {results && results.length > 0 ? (
            <>
              {results.map((guardian) => (
                <button
                  key={guardian.id}
                  type="button"
                  onClick={() => {
                    onSelect(guardian);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {initials(guardian.firstName, guardian.lastName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {guardian.lastName} {guardian.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {guardian.phone} • {guardian.relationType}
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              <button
                type="button"
                onClick={onCreateNew}
                className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left text-primary"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Creer un nouveau {label.toLowerCase()}
                </span>
              </button>
            </>
          ) : (
            <div className="p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Aucun tuteur trouve pour "{query}"
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCreateNew}
              >
                <UserPlus className="h-4 w-4" />
                Creer un nouveau {label.toLowerCase()}
              </Button>
            </div>
          )}
        </div>
      )}

      {query.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateNew}
          className="w-full"
        >
          <UserPlus className="h-4 w-4" />
          Creer un nouveau {label.toLowerCase()}
        </Button>
      )}
    </div>
  );
}
