import { useState } from "react";
import { Loader2, Search, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card, CardContent, Button, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui";
import { useAuditLogs } from "@/hooks/audit";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Creation", color: "bg-green-500/10 text-green-700" },
  UPDATE: { label: "Modification", color: "bg-blue-500/10 text-blue-700" },
  DELETE: { label: "Suppression", color: "bg-red-500/10 text-red-700" },
  LOGIN: { label: "Connexion", color: "bg-purple-500/10 text-purple-700" },
  LOGOUT: { label: "Déconnexion", color: "bg-gray-500/10 text-gray-700" },
  CANCEL: { label: "Annulation", color: "bg-orange-500/10 text-orange-700" },
  VALIDATE: { label: "Validation", color: "bg-cyan-500/10 text-cyan-700" },
};

const MODULE_LABELS: Record<string, string> = {
  student: "Élèves",
  invoice: "Factures",
  payment: "Paiements",
  user: "Utilisateurs",
  role: "Roles",
  school: "Ecole",
  settings: "Paramètres",
  enrollment: "Inscriptions",
  attendance: "Présences",
  grade: "Notes",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogsTab() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [module, setModule] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [search, setSearch] = useState("");

  const filters = {
    page,
    limit,
    module: module || undefined,
    action: action || undefined,
  };

  const { data, isLoading, isFetching } = useAuditLogs(filters);

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Filtrage local sur la recherche (user ou objectType)
  const filtered = search
    ? items.filter((it) => {
        const hay = `${it.user?.firstName || ""} ${it.user?.lastName || ""} ${it.user?.email || ""} ${it.objectType || ""}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      })
    : items;

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Journal d'audit</h3>
              <p className="text-xs text-muted-foreground">
                {total} entree(s) — tracabilite complete des actions
              </p>
            </div>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Recherche</Label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Utilisateur, objet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Module</Label>
              <Select value={module} onValueChange={(v) => { setModule(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {Object.entries(MODULE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Action</Label>
              <Select value={action} onValueChange={(v) => { setAction(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Par page</Label>
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

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Aucune entree d'audit
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((entry) => {
                const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: "bg-gray-500/10 text-gray-700" };
                const moduleLabel = MODULE_LABELS[entry.module] || entry.module;

                return (
                  <div key={entry.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-20 text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                      </div>

                      <div className="shrink-0">
                        <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", actionInfo.color)}>
                          {actionInfo.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "Système"}
                          <span className="text-xs text-muted-foreground ml-2">({entry.user?.email || "n/a"})</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">{moduleLabel}</span>
                          {entry.objectType && (
                            <> · <span className="font-mono">{entry.objectType}</span>{entry.objectId && <> ({entry.objectId.slice(0, 8)})</>}</>
                          )}
                          {entry.ipAddress && <> · IP {entry.ipAddress}</>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} entrees)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
