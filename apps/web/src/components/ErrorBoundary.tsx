import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log technique
    console.error("[ErrorBoundary] Erreur capturee :", error, errorInfo);

    // Envoi optionnel vers un service de monitoring (Sentry, etc.)
    // if (window.Sentry) window.Sentry.captureException(error);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
              <p className="text-sm text-muted-foreground">
                L'application a rencontré un problème inattendu.
                Vos données ne sont pas affectées.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                <summary className="cursor-pointer font-medium">Détails techniques</summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={this.handleReload} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recharger la page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Si le problème persiste, contactez votre administrateur.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
