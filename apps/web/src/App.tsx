import { AppRoutes } from "./routes";
import { AppearanceProvider } from "@/components/providers/AppearanceProvider";

export function App() {
  return (
    <AppearanceProvider>
      <AppRoutes />
    </AppearanceProvider>
  );
}
