import { Loader2 } from "lucide-react";
import { useCurrentCashSession } from "@/hooks/finance/useCashSessions";
import { Card, CardContent } from "@/components/ui";
import { CashSessionOpenForm } from "./components/CashSessionOpenForm";
import { CashSessionHeader } from "./components/CashSessionHeader";

export function PointDeCaissePage() {
  const { data: session, isLoading } = useCurrentCashSession();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <CashSessionOpenForm />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <CashSessionHeader session={session} />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-sm">
              Zone de recherche élève + encaissement (à venir en 4.C)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
