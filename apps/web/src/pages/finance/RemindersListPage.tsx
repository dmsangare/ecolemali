import { useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Phone,
  Receipt,
  Calendar,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/types/finance";
import { useReminders } from "@/hooks/finance/useMessages";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { RemindWhatsAppModal } from "./components/RemindWhatsAppModal";
import type { Reminder } from "@/api/messages";

interface SchoolInfo {
  id: string;
  name: string;
  sigle?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function RemindersListPage() {
  const [minDaysLate, setMinDaysLate] = useState(0);
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const { data, isLoading, refetch } = useReminders(minDaysLate, includeUpcoming);

  // Charger les infos de l'ecole
  const { data: school } = useQuery({
    queryKey: ["school-info"],
    queryFn: async () => {
      const { data } = await api.get("/schools");
      const list = data.data || data;
      return (Array.isArray(list) ? list[0] : list) as SchoolInfo;
    },
    staleTime: 30 * 60_000,
  });

  const reminders: Reminder[] = data?.items || [];
  const totalBalance = reminders.reduce((sum, r) => sum + r.balance, 0);

  const handleRefresh = () => {
    refetch();
    setRefreshKey((k) => k + 1);
  };

  // Couleur du badge selon les jours de retard
  const lateBadge = (days: number) => {
    if (days < 0) return "bg-blue-100 text-blue-800";
    if (days <= 7) return "bg-yellow-100 text-yellow-800";
    if (days <= 30) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const lateLabel = (days: number) => {
    if (days < 0) return `dans ${Math.abs(days)}j`;
    if (days === 0) return "aujourd'hui";
    return `${days}j`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Relances impayes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reminders.length} facture(s) en retard · {formatFCFA(totalBalance)} a recouvrer
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Rafraichir
        </Button>
      </div>

      {/* FILTRES */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Jours de retard minimum :</label>
            <Input
              type="number"
              min={0}
              value={minDaysLate}
              onChange={(e) => setMinDaysLate(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUpcoming}
              onChange={(e) => setIncludeUpcoming(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">
              Inclure les factures a echoir
            </span>
          </label>
          <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400"></span> 0-7j
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400"></span> 8-30j
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> 30j+
            </span>
          </div>
        </div>
      </Card>

      {/* TABLEAU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reminders.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="font-medium">Aucune relance a faire</p>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les factures echues sont a jour ou aucune facture n'a de date d'echeance.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Facture</th>
                  <th className="text-left p-3 font-medium">Élève</th>
                  <th className="text-left p-3 font-medium">Parent</th>
                  <th className="text-center p-3 font-medium">Retard</th>
                  <th className="text-right p-3 font-medium">Solde</th>
                  <th className="text-left p-3 font-medium">Derniere relance</th>
                  <th className="text-right p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.invoiceId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{r.invoiceNumber}</td>
                    <td className="p-3">
                      <div className="font-medium">
                        {r.student.lastName} {r.student.firstName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {r.student.matricule}
                      </div>
                    </td>
                    <td className="p-3">
                      {r.guardian ? (
                        <>
                          <div className="font-medium">
                            {r.guardian.firstName} {r.guardian.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {r.guardian.phone}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-red-600">Aucun parent</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium",
                          lateBadge(r.daysLate),
                        )}
                      >
                        {lateLabel(r.daysLate)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-red-600">
                      {formatFCFA(r.balance)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {r.lastReminder ? (
                        <>
                          <div>
                            {new Date(r.lastReminder.sentAt).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-[10px]">{r.lastReminder.channel}</div>
                        </>
                      ) : (
                        <span className="text-xs italic">Jamais relance</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!r.guardian?.phone}
                        title={
                          !r.guardian?.phone
                            ? "Aucun telephone renseigne"
                            : "Relancer par WhatsApp"
                        }
                        onClick={() => setSelectedReminder(r)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        Relancer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODALE WHATSAPP */}
      {selectedReminder && (
        <RemindWhatsAppModal
          reminder={selectedReminder}
          schoolName={school?.name || "Ecole"}
          schoolPhone={school?.phone}
          schoolAddress={school?.address}
          onClose={() => setSelectedReminder(null)}
          onSent={handleRefresh}
        />
      )}
    </div>
  );
}
