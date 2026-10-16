import { useSearchParams } from "react-router-dom";
import { Tag, Coins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeTypesListPage } from "./FeeTypesListPage";
import { FeeStructuresListPage } from "./FeeStructuresListPage";

const VALID_TABS = ["types", "grille"];

export function ConfigurationFinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "types";
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : "types";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold">Configuration financière</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Types de frais et grille tarifaire de l'établissement
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="types" className="gap-2">
              <Tag className="h-4 w-4" />
              Types de frais
            </TabsTrigger>
            <TabsTrigger value="grille" className="gap-2">
              <Coins className="h-4 w-4" />
              Grille tarifaire
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="types" className="m-0">
          <FeeTypesListPage />
        </TabsContent>

        <TabsContent value="grille" className="m-0">
          <FeeStructuresListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
