import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { QuickActionFab } from "./QuickActionFab";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (desktop fixe, mobile drawer) */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar />
        <button
          type="button"
          className="absolute top-4 right-4 md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header (avec burger mobile intégré) */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* FAB actions rapides */}
      <QuickActionFab />
    </div>
  );
}
