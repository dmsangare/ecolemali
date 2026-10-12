import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/settings/useSettings";

function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;

  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    // Ne rien faire si pas connecte
    if (!isAuthenticated) return;

    const primary = settings?.data?.appearance?.primaryColor;
    if (!primary) return;

    const hsl = hexToHsl(primary);
    if (!hsl) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
  }, [settings?.data?.appearance?.primaryColor, isAuthenticated, isLoading]);

  return <>{children}</>;
}
