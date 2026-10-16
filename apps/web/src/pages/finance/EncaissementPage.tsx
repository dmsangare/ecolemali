import { useSearchParams } from "react-router-dom";
import { Coins, Wallet, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointDeCaissePage } from "./PointDeCaissePage";
import { PaymentsListPage } from "./PaymentsListPage";
import { CashSessionsListPage } from "./CashSessionsListPage";

const VALID_TABS = ["point", "historique", "sessions"];

export function EncaissementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "point";
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : "point";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold">Encaissement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Point de caisse, historique des paiements et sessions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="point" className="gap-2">
              <Coins className="h-4 w-4" />
              Point de caisse
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <History className="h-4 w-4" />
              Historique paiements
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Wallet className="h-4 w-4" />
              Sessions de caisse
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="point" className="m-0">
          <PointDeCaissePage />
        </TabsContent>

        <TabsContent value="historique" className="m-0">
          <PaymentsListPage />
        </TabsContent>

        <TabsContent value="sessions" className="m-0">
          <CashSessionsListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
