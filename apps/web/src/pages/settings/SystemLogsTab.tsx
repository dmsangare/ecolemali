import { useState } from "react";
import { Loader2, AlertOctagon, ChevronLeft, ChevronRight, Bug } from "lucide-react";
import {
  Card, CardContent, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui";
import { useSystemLogs } from "@/hooks/systemLogs";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  ERROR: { label: "Erreur", color: "bg-red-500/10 text-red-700" },
  WARN: { label: "Avertissement", color: "bg-orange-500/10 text-orange-700" },
  INFO: { label: "Info", color: "bg-blue-500/10 text-blue-700" },
  DEBUG: { label: "Debug", color: "bg-gray-500/10 text-gray-700" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SystemLogsTab() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [level, setLevel] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filters = { page, limit, level: level || undefined };
  const { data, isLoading, isFetching } = useSystemLogs(filters);

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Journal système</h3>
              <p className="text-xs text-muted-foreground">
                {total} erreur(s) serveur enregistree(s) — erreurs 5xx
              </p>
            </div>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs">Niveau</label>
              <Select value={level} onValueChange={(v) => { setLevel(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  <SelectItem value="ERROR">Erreur</SelectItem>
                  <SelectItem value="WARN">Avertissement</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs">Par page</label>
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <AlertOctagon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Aucune erreur système enregistree
              <p className="text-xs mt-1">Les erreurs 5xx apparaitront ici automatiquement.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((entry) => {
                const lvl = LEVEL_LABELS[entry.level] || { label: entry.level, color: "bg-gray-500/10 text-gray-700" };
                const isExpanded = expanded === entry.id;

                return (
                  <div key={entry.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    >
                      <div className="shrink-0 w-32 text-right">
                        <p className="text-xs text-muted-foreground font-mono">{formatDate(entry.createdAt)}</p>
                      </div>

                      <div className="shrink-0">
                        <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", lvl.color)}>
                          {lvl.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        {entry.module && (
                          <span className="text-xs font-mono text-muted-foreground">[{entry.module}] </span>
                        )}
                        <span className="text-sm">{entry.message}</span>
                      </div>

                      <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    </div>

                    {isExpanded && entry.context && (
                      <div className="mt-3 ml-32 text-xs">
                        <pre className="bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">
                          {JSON.stringify(entry.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} entrees)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
