import { AppRoutes } from "./routes";
import { AppearanceProvider } from "@/components/providers/AppearanceProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <AppearanceProvider>
        <AppRoutes />
      </AppearanceProvider>
    </ErrorBoundary>
  );
}
